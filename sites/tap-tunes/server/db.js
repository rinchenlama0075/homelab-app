const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'onboarding', -- onboarding | active | paused
    spotify_refresh_token TEXT,
    spotify_device_id TEXT,
    stripe_connect_account_id TEXT,
    stripe_connect_charges_enabled INTEGER NOT NULL DEFAULT 0,
    house_playlist_uri TEXT,
    explicit_filter INTEGER NOT NULL DEFAULT 1, -- 1 = block explicit tracks
    price_bundle_config_json TEXT NOT NULL DEFAULT '[
      {"tokens":1,"amountCents":100,"label":"1 song"},
      {"tokens":4,"amountCents":300,"label":"4 songs"},
      {"tokens":8,"amountCents":500,"label":"8 songs"}
    ]',
    max_queue_depth INTEGER NOT NULL DEFAULT 25,
    request_cooldown_seconds INTEGER NOT NULL DEFAULT 60,
    kiosk_token TEXT NOT NULL,
    venue_payout_bps INTEGER NOT NULL DEFAULT 300, -- 3.00% in basis points
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS owner_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    nfc_slug TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(venue_id, nfc_slug)
  );

  -- Anonymous, phone-scoped session: created the first time a browser hits a
  -- venue's order page (no login). Tracks the customer's unspent song tokens.
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    tokens_remaining INTEGER NOT NULL DEFAULT 0,
    last_request_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS token_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    stripe_checkout_session_id TEXT NOT NULL UNIQUE,
    stripe_payment_intent_id TEXT,
    tokens_purchased INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- One row per requested/playing/played song. This IS the queue: "queued"
  -- rows ordered by requested_at are the up-next list for a venue.
  CREATE TABLE IF NOT EXISTS plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    purchase_id INTEGER REFERENCES token_purchases(id) ON DELETE SET NULL,
    track_uri TEXT NOT NULL,
    track_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    duration_ms INTEGER,
    price_cents INTEGER NOT NULL DEFAULT 75,
    status TEXT NOT NULL DEFAULT 'queued', -- queued | playing | played | skipped | refunded
    requested_at TEXT NOT NULL DEFAULT (datetime('now')),
    started_at TEXT,
    ended_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    gross_revenue_cents INTEGER NOT NULL,
    venue_share_cents INTEGER NOT NULL,
    stripe_transfer_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | skipped | failed
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_plays_venue_status ON plays(venue_id, status, requested_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_venue ON sessions(venue_id);
`);

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = { db, DATA_DIR, randomToken };
