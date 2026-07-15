const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS commitments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_per_week INTEGER NOT NULL DEFAULT 1,
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_filename TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(post_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commitment_id INTEGER REFERENCES commitments(id) ON DELETE CASCADE,
    badge_code TEXT NOT NULL,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, commitment_id, badge_code)
  );

  CREATE TABLE IF NOT EXISTS points_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
    badge_code TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// SQLite has no "ADD COLUMN IF NOT EXISTS", so guard the migration manually.
const postsColumns = db.prepare("PRAGMA table_info(posts)").all();
if (!postsColumns.some((column) => column.name === "commitment_id")) {
  db.exec("ALTER TABLE posts ADD COLUMN commitment_id INTEGER REFERENCES commitments(id)");
}
if (!postsColumns.some((column) => column.name === "type")) {
  db.exec("ALTER TABLE posts ADD COLUMN type TEXT NOT NULL DEFAULT 'check_in'");
}
if (!postsColumns.some((column) => column.name === "milestone_meta")) {
  db.exec("ALTER TABLE posts ADD COLUMN milestone_meta TEXT");
}

const commitmentsColumns = db.prepare("PRAGMA table_info(commitments)").all();
if (!commitmentsColumns.some((column) => column.name === "end_date")) {
  // Nullable: existing commitments stay open-ended. Stored as a plain
  // "YYYY-MM-DD" date (no time component) — the commitment stays active
  // through the end of that day.
  db.exec("ALTER TABLE commitments ADD COLUMN end_date TEXT");
}

module.exports = { db, DATA_DIR, UPLOADS_DIR };
