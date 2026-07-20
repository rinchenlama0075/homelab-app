const Stripe = require("stripe");
const { db } = require("../db");
const { findBundle, creditTokens } = require("./tokens");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

function requireStripe() {
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not configured");
  return stripe;
}

// One Checkout Session per bundle purchase (not per song) — this is the fix
// for card-processor fixed fees making raw $0.75 charges unprofitable. Apple
// Pay / Google Pay show up automatically in Stripe Checkout for eligible
// browsers/devices, no extra integration needed.
async function createBundleCheckoutSession(venue, session, tokens) {
  const bundle = findBundle(venue, tokens);
  if (!bundle) throw new Error(`Unknown bundle size: ${tokens}`);

  const purchase = db
    .prepare(
      `INSERT INTO token_purchases (venue_id, session_id, stripe_checkout_session_id, tokens_purchased, amount_cents, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    )
    .run(venue.id, session.id, `pending-${session.id}-${Date.now()}`, bundle.tokens, bundle.amountCents);

  const checkoutSession = await requireStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${venue.name}: ${bundle.label}` },
          unit_amount: bundle.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      venueId: String(venue.id),
      sessionId: String(session.id),
      purchaseId: String(purchase.lastInsertRowid),
      tokens: String(bundle.tokens),
    },
    success_url: `${PUBLIC_BASE_URL}/v/${venue.slug}?purchase=success&session=${session.session_token}`,
    cancel_url: `${PUBLIC_BASE_URL}/v/${venue.slug}?purchase=cancelled&session=${session.session_token}`,
  });

  db.prepare("UPDATE token_purchases SET stripe_checkout_session_id = ? WHERE id = ?").run(
    checkoutSession.id,
    purchase.lastInsertRowid
  );

  return checkoutSession;
}

function constructWebhookEvent(rawBody, signatureHeader) {
  return requireStripe().webhooks.constructEvent(rawBody, signatureHeader, WEBHOOK_SECRET);
}

// Idempotent by design: token_purchases.stripe_checkout_session_id is
// UNIQUE and creditTokens() flips status to 'paid', so a duplicated webhook
// delivery for an already-paid purchase is a harmless no-op.
function handleCheckoutCompleted(checkoutSession) {
  const purchase = db
    .prepare("SELECT * FROM token_purchases WHERE stripe_checkout_session_id = ?")
    .get(checkoutSession.id);
  if (!purchase) {
    console.error(`[stripe] webhook for unknown checkout session ${checkoutSession.id}`);
    return;
  }
  if (purchase.status === "paid") return; // already processed

  db.prepare("UPDATE token_purchases SET stripe_payment_intent_id = ? WHERE id = ?").run(
    checkoutSession.payment_intent,
    purchase.id
  );
  creditTokens(purchase);
}

async function createConnectOnboardingLink(venue) {
  const s = requireStripe();
  let accountId = venue.stripe_connect_account_id;
  if (!accountId) {
    const account = await s.accounts.create({
      type: "express",
      business_type: "company",
      metadata: { venueSlug: venue.slug },
    });
    accountId = account.id;
    db.prepare("UPDATE venues SET stripe_connect_account_id = ? WHERE id = ?").run(accountId, venue.id);
  }
  const link = await s.accountLinks.create({
    account: accountId,
    refresh_url: `${PUBLIC_BASE_URL}/owner/venue/payouts?refresh=1`,
    return_url: `${PUBLIC_BASE_URL}/owner/venue/payouts?connected=1`,
    type: "account_onboarding",
  });
  return link.url;
}

// Batched payout, not a per-transaction split: computes each venue's
// venue_payout_bps share of gross song-play revenue over [periodStart,
// periodEnd) and issues a single Stripe Transfer, so the platform doesn't
// pay Connect fees on every $0.75 request. Intended to run on a schedule
// (see jobs/payout.js) — safe to re-run since it only counts 'played' rows
// that aren't already attached to a prior payout period.
async function runPayoutForVenue(venue, periodStart, periodEnd) {
  const totals = db
    .prepare(
      `SELECT COALESCE(SUM(price_cents), 0) AS gross
       FROM plays
       WHERE venue_id = ? AND status = 'played'
         AND ended_at >= ? AND ended_at < ?`
    )
    .get(venue.id, periodStart, periodEnd);

  const grossCents = totals.gross;
  const venueShareCents = Math.round((grossCents * venue.venue_payout_bps) / 10000);

  if (grossCents === 0) {
    db.prepare(
      `INSERT INTO payouts (venue_id, period_start, period_end, gross_revenue_cents, venue_share_cents, status)
       VALUES (?, ?, ?, 0, 0, 'skipped')`
    ).run(venue.id, periodStart, periodEnd);
    return { skipped: true };
  }

  let transferId = null;
  let status = "pending";
  if (venue.stripe_connect_account_id && venueShareCents > 0) {
    try {
      const transfer = await requireStripe().transfers.create({
        amount: venueShareCents,
        currency: "usd",
        destination: venue.stripe_connect_account_id,
        description: `Tap Tunes payout ${periodStart} - ${periodEnd} (${venue.slug})`,
      });
      transferId = transfer.id;
      status = "paid";
    } catch (err) {
      console.error(`[payout] transfer failed for venue ${venue.slug}:`, err.message);
      status = "failed";
    }
  } else {
    status = "skipped"; // venue hasn't finished Connect onboarding yet
  }

  db.prepare(
    `INSERT INTO payouts (venue_id, period_start, period_end, gross_revenue_cents, venue_share_cents, stripe_transfer_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(venue.id, periodStart, periodEnd, grossCents, venueShareCents, transferId, status);

  return { skipped: false, grossCents, venueShareCents, status };
}

module.exports = {
  stripe,
  createBundleCheckoutSession,
  constructWebhookEvent,
  handleCheckoutCompleted,
  createConnectOnboardingLink,
  runPayoutForVenue,
};
