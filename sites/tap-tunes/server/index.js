const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { db } = require("./db");
const { attachOwner } = require("./lib/auth");
const { QueueEngine } = require("./lib/queue");
const { SpotifyProvider, spotifyConfigured } = require("./lib/playback/spotify");

const publicRoutes = require("./routes/public");
const playerRoutes = require("./routes/player");
const ownerRoutes = require("./routes/owner");
const oauthRoutes = require("./routes/oauth");
const webhookRoutes = require("./routes/webhooks");

const PORT = process.env.PORT || 4100;
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: false } });

const playbackProvider = new SpotifyProvider();
const queueEngine = new QueueEngine(io, playbackProvider);

if (!spotifyConfigured()) {
  console.warn(
    "[startup] SPOTIFY_CLIENT_ID is not set — search/playback routes will fail until it's configured."
  );
}

// Stripe webhook needs the raw body for signature verification, so it's
// mounted with express.raw() *before* the global express.json() below.
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes.buildRouter());

app.use(express.json());
app.use(cookieParser());
app.use(attachOwner);

app.get("/api/health", (_req, res) => res.type("text").send("ok"));

app.use("/api/v", publicRoutes.buildRouter({ queueEngine, playbackProvider }));
app.use("/api/player", playerRoutes.buildRouter({ queueEngine, playbackProvider }));
app.use("/api/owner", ownerRoutes.buildRouter({ queueEngine, playbackProvider }));
app.use("/api/oauth", oauthRoutes.buildRouter({ playbackProvider }));

app.use((err, _req, res, _next) => {
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Something went wrong." });
});

// Every client — customer PWA, kiosk, and owner dashboard alike — joins the
// same per-venue room and gets the current snapshot immediately, then live
// "queue:updated" pushes from QueueEngine.broadcast from then on.
io.on("connection", (socket) => {
  socket.on("join", (venueId) => {
    const id = Number(venueId);
    const venue = db.prepare("SELECT id FROM venues WHERE id = ?").get(id);
    if (!venue) return;
    socket.join(`venue:${id}`);
    socket.emit("queue:updated", queueEngine.getSnapshot(id));
  });
});

httpServer.listen(PORT, () => {
  console.log(`Tap Tunes API listening on port ${PORT}`);
});
