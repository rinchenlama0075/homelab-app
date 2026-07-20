const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("../db");

const JWT_SECRET = process.env.OWNER_JWT_SECRET || "dev-owner-secret-change-me";
const COOKIE_NAME = "tt_owner_token";
const SESSION_TTL = "12h";

function signOwnerToken(ownerId) {
  return jwt.sign({ sub: ownerId }, JWT_SECRET, { expiresIn: SESSION_TTL });
}

function setOwnerCookie(res, ownerId) {
  res.cookie(COOKIE_NAME, signOwnerToken(ownerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
  });
}

function clearOwnerCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function publicOwner(owner) {
  return { id: owner.id, email: owner.email, venueId: owner.venue_id, role: owner.role };
}

function getOwnerFromRequest(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const owner = db.prepare("SELECT * FROM owner_users WHERE id = ?").get(payload.sub);
    return owner || null;
  } catch {
    return null;
  }
}

function attachOwner(req, _res, next) {
  req.owner = getOwnerFromRequest(req);
  next();
}

// Owners only ever manage the one venue they were created for (req.owner.venue_id).
// If/when Tap Tunes needs multi-venue owners or a platform superadmin,
// extend the role column rather than trusting a venue id the client sends.
function requireOwner(req, res, next) {
  if (!req.owner) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = {
  COOKIE_NAME,
  setOwnerCookie,
  clearOwnerCookie,
  attachOwner,
  requireOwner,
  publicOwner,
  hashPassword,
  verifyPassword,
};
