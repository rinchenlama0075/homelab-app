const express = require("express");
const { db } = require("../db");

// The kiosk device has no user to log in — it's a physical box pinned to one
// URL. Auth is a long-lived per-venue token baked into that URL at setup
// time (owner dashboard shows/regenerates it), checked on every request.
function buildRouter({ queueEngine, playbackProvider }) {
  const router = express.Router();

  function loadVenueByToken(req, res, next) {
    const venue = db.prepare("SELECT * FROM venues WHERE id = ?").get(Number(req.params.venueId));
    if (!venue) return res.status(404).json({ error: "Venue not found" });
    if (!req.query.token || req.query.token !== venue.kiosk_token) {
      return res.status(403).json({ error: "Invalid kiosk token" });
    }
    req.venue = venue;
    next();
  }

  router.use("/:venueId", loadVenueByToken);

  router.get("/:venueId/bootstrap", async (req, res) => {
    try {
      const accessToken = await playbackProvider.getAccessTokenForBrowser(req.venue);
      res.json({
        venue: { id: req.venue.id, slug: req.venue.slug, name: req.venue.name },
        housePlaylistUri: req.venue.house_playlist_uri,
        spotifyAccessToken: accessToken,
        queue: queueEngine.getSnapshot(req.venue.id),
      });
    } catch (err) {
      console.error("[player] bootstrap failed:", err.message);
      res.status(502).json({ error: "This venue hasn't connected Spotify yet." });
    }
  });

  // Refreshing the Web Playback SDK token periodically (it expires ~1h) —
  // called from the kiosk page on a timer.
  router.get("/:venueId/token", async (req, res) => {
    try {
      const accessToken = await playbackProvider.getAccessTokenForBrowser(req.venue);
      res.json({ accessToken });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  router.post("/:venueId/device", async (req, res) => {
    const { deviceId } = req.body || {};
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });
    try {
      await playbackProvider.transferPlayback(req.venue, deviceId);
      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  router.post("/:venueId/track-started", (req, res) => {
    const { uri } = req.body || {};
    if (!uri) return res.status(400).json({ error: "uri is required" });
    const play = queueEngine.markTrackStarted(req.venue.id, uri);
    res.json({ play });
  });

  router.post("/:venueId/track-ended", async (req, res) => {
    const { uri } = req.body || {};
    if (!uri) return res.status(400).json({ error: "uri is required" });
    const play = queueEngine.markTrackEnded(req.venue.id, uri);

    if (queueEngine.queueDepth(req.venue.id) === 0 && typeof playbackProvider.playHousePlaylist === "function") {
      playbackProvider.playHousePlaylist(req.venue).catch((err) => {
        console.error("[player] house playlist fallback failed:", err.message);
      });
    }

    res.json({ play });
  });

  router.get("/:venueId/queue", (req, res) => {
    res.json(queueEngine.getSnapshot(req.venue.id));
  });

  return router;
}

module.exports = { buildRouter };
