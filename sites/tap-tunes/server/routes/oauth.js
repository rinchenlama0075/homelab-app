const express = require("express");

// Spotify redirects the browser here after the venue owner grants access —
// no owner cookie is present on this hop (it's a top-level navigation from
// accounts.spotify.com), so identity comes entirely from the `state` value
// we set to the venue id when building the auth URL (routes/owner.js).
function buildRouter({ playbackProvider }) {
  const router = express.Router();

  router.get("/spotify/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      return res.status(400).send(`Spotify authorization failed: ${error}`);
    }
    const venueId = Number(state);
    if (!code || !venueId) {
      return res.status(400).send("Missing code or state.");
    }
    try {
      await playbackProvider.handleOAuthCallback(code, venueId);
      res.send(
        "<html><body>Spotify connected. You can close this tab and return to the Tap Tunes owner dashboard.</body></html>"
      );
    } catch (err) {
      console.error("[oauth] Spotify callback failed:", err.message);
      res.status(502).send("Failed to connect Spotify. Please try again from the owner dashboard.");
    }
  });

  return router;
}

module.exports = { buildRouter };
