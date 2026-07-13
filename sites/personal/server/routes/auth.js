const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { setAuthCookie, clearAuthCookie, requireAuth } = require("../middleware/auth");

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function publicUser(user) {
  return { id: user.id, username: user.username, createdAt: user.created_at };
}

router.post("/signup", (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return res.status(400).json({
      error: "Username must be 3-20 characters (letters, numbers, underscore only).",
    });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return res.status(409).json({ error: "That username is already taken." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash);

  const user = db
    .prepare("SELECT id, username, created_at FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  setAuthCookie(res, user.id);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  setAuthCookie(res, user.id);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
