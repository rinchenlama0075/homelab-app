const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { setAdminCookie, clearAdminCookie, isAuthenticated } = require("../middleware/adminAuth");

const router = express.Router();

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

// Prefer Cloudflare's client-IP header (set on every proxied request) over
// req.ip, since req.ip resolves through the Caddy/nginx XFF chain and would
// otherwise bucket all visitors together behind those hops.
function clientIp(req) {
  return req.headers["cf-connecting-ip"] || req.ip;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Too many login attempts. Try again later." },
});

router.post("/login", loginLimiter, (req, res) => {
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(500).json({
      error: "ADMIN_PASSWORD_HASH is not configured on the server.",
    });
  }

  const { password } = req.body || {};
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Password is required." });
  }

  if (!bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  setAdminCookie(res);
  res.json({ ok: true });
});

router.post("/logout", (_req, res) => {
  clearAdminCookie(res);
  res.status(204).end();
});

router.get("/session", (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});

module.exports = router;
