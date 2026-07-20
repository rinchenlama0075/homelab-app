const rateLimit = require("express-rate-limit");

// Prefer Cloudflare's client-IP header over req.ip, since req.ip resolves
// through the Caddy/nginx proxy chain and would otherwise bucket every
// visitor together behind those hops (same reasoning as sites/personal's
// admin login limiter).
function clientIp(req) {
  return req.headers["cf-connecting-ip"] || req.ip;
}

// Loose IP-level backstop against a single phone hammering the API — the
// real per-song throttle is the venue's request_cooldown_seconds enforced in
// lib/tokens.js#spendToken, which is per-session, not per-IP (a busy bar's
// NAT/CGNAT can put many customers behind one IP).
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Too many searches. Slow down a moment." },
});

const queueLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Too many requests. Slow down a moment." },
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: "Too many checkout attempts. Try again shortly." },
});

module.exports = { clientIp, searchLimiter, queueLimiter, checkoutLimiter };
