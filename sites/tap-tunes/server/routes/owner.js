const express = require("express");
const rateLimit = require("express-rate-limit");
const { db, randomToken } = require("../db");
const {
  setOwnerCookie,
  clearOwnerCookie,
  requireOwner,
  publicOwner,
  verifyPassword,
} = require("../lib/auth");
const { clientIp } = require("../middleware/rateLimit");
const { createConnectOnboardingLink } = require("../lib/stripe");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Too many login attempts. Try again later." },
});

function ownerVenue(req) {
  return db.prepare("SELECT * FROM venues WHERE id = ?").get(req.owner.venue_id);
}

function buildRouter({ playbackProvider, queueEngine }) {
  const router = express.Router();

  router.post("/login", loginLimiter, (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const owner = db.prepare("SELECT * FROM owner_users WHERE email = ?").get(email.toLowerCase());
    if (!owner || !verifyPassword(password, owner.password_hash)) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    setOwnerCookie(res, owner.id);
    res.json({ owner: publicOwner(owner) });
  });

  router.post("/logout", (_req, res) => {
    clearOwnerCookie(res);
    res.status(204).end();
  });

  router.get("/me", requireOwner, (req, res) => {
    res.json({ owner: publicOwner(req.owner), venue: ownerVenue(req) });
  });

  router.get("/venue", requireOwner, (req, res) => {
    res.json({ venue: ownerVenue(req) });
  });

  router.put("/venue", requireOwner, (req, res) => {
    const venue = ownerVenue(req);
    const {
      name,
      housePlaylistUri,
      explicitFilter,
      priceBundles,
      maxQueueDepth,
      requestCooldownSeconds,
    } = req.body || {};

    db.prepare(
      `UPDATE venues SET
        name = COALESCE(?, name),
        house_playlist_uri = COALESCE(?, house_playlist_uri),
        explicit_filter = COALESCE(?, explicit_filter),
        price_bundle_config_json = COALESCE(?, price_bundle_config_json),
        max_queue_depth = COALESCE(?, max_queue_depth),
        request_cooldown_seconds = COALESCE(?, request_cooldown_seconds)
       WHERE id = ?`
    ).run(
      name ?? null,
      housePlaylistUri ?? null,
      typeof explicitFilter === "boolean" ? Number(explicitFilter) : null,
      Array.isArray(priceBundles) ? JSON.stringify(priceBundles) : null,
      Number.isInteger(maxQueueDepth) ? maxQueueDepth : null,
      Number.isInteger(requestCooldownSeconds) ? requestCooldownSeconds : null,
      venue.id
    );

    res.json({ venue: ownerVenue(req) });
  });

  router.post("/venue/kiosk-token/regenerate", requireOwner, (req, res) => {
    const token = randomToken(16);
    db.prepare("UPDATE venues SET kiosk_token = ? WHERE id = ?").run(token, req.owner.venue_id);
    res.json({ kioskToken: token });
  });

  // --- Spotify connect (owner logs the venue's own Premium account in once) ---

  router.get("/venue/spotify/connect", requireOwner, (req, res) => {
    res.json({ url: playbackProvider.getAuthUrl(req.owner.venue_id) });
  });

  router.get("/venue/spotify/devices", requireOwner, async (req, res) => {
    try {
      const devices = await playbackProvider.listDevices(ownerVenue(req));
      res.json({ devices });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  router.post("/venue/spotify/devices/:deviceId/activate", requireOwner, async (req, res) => {
    try {
      await playbackProvider.transferPlayback(ownerVenue(req), req.params.deviceId);
      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  // --- Stripe Connect (payouts) ---

  router.get("/venue/stripe/connect", requireOwner, async (req, res) => {
    try {
      const url = await createConnectOnboardingLink(ownerVenue(req));
      res.json({ url });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  router.get("/venue/payouts", requireOwner, (req, res) => {
    const payouts = db
      .prepare("SELECT * FROM payouts WHERE venue_id = ? ORDER BY created_at DESC LIMIT 52")
      .all(req.owner.venue_id);
    res.json({ payouts });
  });

  // --- Revenue snapshot ---

  router.get("/venue/revenue", requireOwner, (req, res) => {
    const totals = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN ended_at > datetime('now', '-1 day') THEN price_cents ELSE 0 END), 0) AS today_cents,
           COALESCE(SUM(CASE WHEN ended_at > datetime('now', '-7 day') THEN price_cents ELSE 0 END), 0) AS week_cents,
           COALESCE(SUM(CASE WHEN ended_at > datetime('now', '-30 day') THEN price_cents ELSE 0 END), 0) AS month_cents,
           COUNT(CASE WHEN status = 'played' THEN 1 END) AS total_plays
         FROM plays WHERE venue_id = ? AND status = 'played'`
      )
      .get(req.owner.venue_id);
    res.json({ revenue: totals });
  });

  // --- Live queue moderation ---

  router.get("/venue/queue", requireOwner, (req, res) => {
    res.json(queueEngine.getSnapshot(req.owner.venue_id));
  });

  router.post("/venue/queue/:playId/skip", requireOwner, (req, res) => {
    const ok = queueEngine.skip(req.owner.venue_id, Number(req.params.playId));
    res.json({ ok });
  });

  // --- NFC tables/tags ---

  router.get("/venue/tables", requireOwner, (req, res) => {
    const tables = db
      .prepare("SELECT * FROM tables WHERE venue_id = ? ORDER BY label")
      .all(req.owner.venue_id);
    res.json({ tables });
  });

  router.post("/venue/tables", requireOwner, (req, res) => {
    const { label, nfcSlug } = req.body || {};
    if (!label || !nfcSlug) {
      return res.status(400).json({ error: "label and nfcSlug are required" });
    }
    try {
      const result = db
        .prepare("INSERT INTO tables (venue_id, label, nfc_slug) VALUES (?, ?, ?)")
        .run(req.owner.venue_id, label, nfcSlug);
      res.status(201).json({ table: db.prepare("SELECT * FROM tables WHERE id = ?").get(result.lastInsertRowid) });
    } catch (err) {
      res.status(409).json({ error: "That tag slug is already registered for this venue." });
    }
  });

  router.delete("/venue/tables/:id", requireOwner, (req, res) => {
    db.prepare("DELETE FROM tables WHERE id = ? AND venue_id = ?").run(
      Number(req.params.id),
      req.owner.venue_id
    );
    res.status(204).end();
  });

  return router;
}

module.exports = { buildRouter };
