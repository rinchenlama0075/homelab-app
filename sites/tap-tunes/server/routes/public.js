const express = require("express");
const { db } = require("../db");
const { getOrCreateSession, getBundles, spendToken, pricePerTokenCents } = require("../lib/tokens");
const { cookieNameForVenue } = require("../lib/tokens");
const { createBundleCheckoutSession } = require("../lib/stripe");
const { searchLimiter, queueLimiter, checkoutLimiter } = require("../middleware/rateLimit");

function buildRouter({ queueEngine, playbackProvider }) {
  const router = express.Router();

  function loadVenue(req, res, next) {
    const venue = db.prepare("SELECT * FROM venues WHERE slug = ?").get(req.params.venueSlug);
    if (!venue || venue.status === "paused") {
      return res.status(404).json({ error: "Venue not found" });
    }
    req.venue = venue;
    next();
  }

  function loadSession(req, res, next) {
    const cookieName = cookieNameForVenue(req.venue.slug);
    const session = getOrCreateSession(req.venue, req.cookies?.[cookieName]);
    if (req.cookies?.[cookieName] !== session.session_token) {
      res.cookie(cookieName, session.session_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 12 * 60 * 60 * 1000, // one long bar night
      });
    }
    req.session_ = session; // avoid clashing with express-session-style `req.session`
    next();
  }

  router.use("/:venueSlug", loadVenue);
  router.use("/:venueSlug", loadSession);

  router.get("/:venueSlug", (req, res) => {
    const venue = req.venue;
    res.json({
      venue: {
        slug: venue.slug,
        name: venue.name,
        bundles: getBundles(venue),
        housePlaylistUri: venue.house_playlist_uri,
      },
      session: {
        token: req.session_.session_token,
        tokensRemaining: req.session_.tokens_remaining,
      },
      queue: queueEngine.getSnapshot(venue.id),
    });
  });

  router.get("/:venueSlug/search", searchLimiter, async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ tracks: [] });
    try {
      const tracks = await playbackProvider.search(q, { limit: 20 });
      const filtered = req.venue.explicit_filter ? tracks.filter((t) => !t.explicit) : tracks;
      res.json({ tracks: filtered });
    } catch (err) {
      console.error("[public] search failed:", err.message);
      res.status(502).json({ error: "Music search is temporarily unavailable." });
    }
  });

  router.post("/:venueSlug/checkout", checkoutLimiter, async (req, res) => {
    const tokens = Number(req.body?.tokens);
    if (!tokens || tokens <= 0) {
      return res.status(400).json({ error: "tokens is required" });
    }
    try {
      const checkoutSession = await createBundleCheckoutSession(req.venue, req.session_, tokens);
      res.json({ url: checkoutSession.url });
    } catch (err) {
      console.error("[public] checkout creation failed:", err.message);
      res.status(400).json({ error: err.message });
    }
  });

  router.get("/:venueSlug/queue", (req, res) => {
    res.json(queueEngine.getSnapshot(req.venue.id));
  });

  router.post("/:venueSlug/queue", queueLimiter, async (req, res) => {
    const { uri, name, artist, durationMs } = req.body || {};
    if (!uri || !name || !artist) {
      return res.status(400).json({ error: "uri, name, and artist are required" });
    }

    if (queueEngine.queueDepth(req.venue.id) >= req.venue.max_queue_depth) {
      return res.status(429).json({ error: "The queue is full right now — try again in a bit." });
    }
    if (queueEngine.wasRecentlyRequested(req.venue.id, uri)) {
      return res.status(409).json({ error: "That song was just requested. Pick something else for now." });
    }

    const spend = spendToken(req.venue, req.session_);
    if (!spend.ok) {
      return res.status(402).json({ error: spend.error });
    }

    const priceCents = pricePerTokenCents(req.venue, 1);
    const play = await queueEngine.enqueue(req.venue, { uri, name, artist, durationMs }, {
      sessionId: req.session_.id,
      priceCents,
    });

    res.status(201).json({ play, tokensRemaining: req.session_.tokens_remaining - 1 });
  });

  return router;
}

module.exports = { buildRouter };
