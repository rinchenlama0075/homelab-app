const { db, randomToken } = require("../db");

const SESSION_COOKIE_PREFIX = "tt_session_";

function cookieNameForVenue(venueSlug) {
  return `${SESSION_COOKIE_PREFIX}${venueSlug}`;
}

function getOrCreateSession(venue, existingToken) {
  if (existingToken) {
    const existing = db
      .prepare("SELECT * FROM sessions WHERE venue_id = ? AND session_token = ?")
      .get(venue.id, existingToken);
    if (existing) return existing;
  }
  const token = randomToken(16);
  const result = db
    .prepare("INSERT INTO sessions (venue_id, session_token, tokens_remaining) VALUES (?, ?, 0)")
    .run(venue.id, token);
  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(result.lastInsertRowid);
}

function getBundles(venue) {
  try {
    return JSON.parse(venue.price_bundle_config_json);
  } catch {
    return [{ tokens: 1, amountCents: 100, label: "1 song" }];
  }
}

function findBundle(venue, tokens) {
  return getBundles(venue).find((b) => b.tokens === tokens);
}

// Called once a Stripe payment_intent for a token purchase has actually
// succeeded (from the webhook) — never on the client's say-so.
function creditTokens(purchase) {
  db.prepare("UPDATE sessions SET tokens_remaining = tokens_remaining + ? WHERE id = ?").run(
    purchase.tokens_purchased,
    purchase.session_id
  );
  db.prepare("UPDATE token_purchases SET status = 'paid' WHERE id = ?").run(purchase.id);
}

function pricePerTokenCents(venue, tokensInPurchase) {
  const bundle = findBundle(venue, tokensInPurchase);
  if (!bundle || !bundle.tokens) return 75;
  return Math.round(bundle.amountCents / bundle.tokens);
}

// Returns { ok, error } — spends exactly one token if available and the
// session isn't inside its cooldown window. Runs as a single statement pair
// under sqlite's serialized execution, so concurrent taps from the same
// session can't double-spend a token.
function spendToken(venue, session) {
  if (session.tokens_remaining <= 0) {
    return { ok: false, error: "No song credits remaining. Buy a bundle to keep requesting." };
  }
  if (session.last_request_at) {
    const cooldownMs = venue.request_cooldown_seconds * 1000;
    const elapsed = Date.now() - new Date(`${session.last_request_at}Z`).getTime();
    if (elapsed < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return { ok: false, error: `Please wait ${waitSeconds}s before requesting another song.` };
    }
  }
  db.prepare(
    "UPDATE sessions SET tokens_remaining = tokens_remaining - 1, last_request_at = datetime('now') WHERE id = ?"
  ).run(session.id);
  return { ok: true };
}

module.exports = {
  cookieNameForVenue,
  getOrCreateSession,
  getBundles,
  findBundle,
  creditTokens,
  pricePerTokenCents,
  spendToken,
};
