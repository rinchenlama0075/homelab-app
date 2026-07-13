const jwt = require("jsonwebtoken");

const ADMIN_HOST = process.env.ADMIN_HOST || "admin.rinchen.co";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "dev-admin-secret-change-me";
const COOKIE_NAME = "admin_token";
const SESSION_TTL = "12h";

// Defense in depth: even though nginx only ever proxies this service for
// requests to ADMIN_HOST, double-check here in case the service is ever
// reached directly (e.g. a compose network misconfiguration).
function requireAdminHost(req, res, next) {
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(":")[0];
  if (host !== ADMIN_HOST) {
    return res.status(404).end();
  }
  next();
}

function signAdminToken() {
  return jwt.sign({ admin: true }, ADMIN_JWT_SECRET, { expiresIn: SESSION_TTL });
}

function setAdminCookie(res) {
  res.cookie(COOKIE_NAME, signAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
  });
}

function clearAdminCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function isAuthenticated(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    return payload?.admin === true;
  } catch {
    return false;
  }
}

function requireAdminSession(req, res, next) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

module.exports = {
  ADMIN_HOST,
  COOKIE_NAME,
  requireAdminHost,
  requireAdminSession,
  setAdminCookie,
  clearAdminCookie,
  isAuthenticated,
};
