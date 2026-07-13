const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { requireAdminHost } = require("./middleware/adminAuth");
const authRouter = require("./routes/auth");
const statusRouter = require("./routes/status");
const containersRouter = require("./routes/containers");
const deploysRouter = require("./routes/deploys");

const app = express();
const PORT = process.env.PORT || 4001;

// Caddy -> nginx -> here: two proxy hops we control and trust for XFF.
app.set("trust proxy", 2);

app.use(helmet());
app.use((_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});
app.use(express.json());
app.use(cookieParser());

// Unauthenticated, host-agnostic — used by Docker's own HEALTHCHECK, which
// talks to the container directly and never sends an admin.rinchen.co Host header.
app.get("/api/health", (_req, res) => res.type("text").send("ok"));

// Everything else only ever responds for Host: $ADMIN_HOST — nginx already
// enforces this at the reverse-proxy layer, this is a second, independent check.
app.use(requireAdminHost);

app.use("/api", authRouter);
app.use("/api", statusRouter);
app.use("/api", containersRouter);
app.use("/api", deploysRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`Admin API listening on port ${PORT}`);
});
