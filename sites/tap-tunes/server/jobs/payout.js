// Weekly venue payout batch job. Intended to be invoked by a systemd timer
// (or plain cron) on the homelab server, similar in spirit to
// infra/monitoring/check-health.sh's timer:
//
//   docker compose --project-directory sites/tap-tunes --project-name tap-tunes \
//     run --rm api node jobs/payout.js
//
// Safe to re-run: each venue/period pair only ever sums 'played' rows whose
// ended_at falls in [periodStart, periodEnd), and payouts rows are an
// append-only record of what was computed — running it twice for the same
// window just double-counts in the payouts table for visibility, it does
// NOT double-transfer money for the same plays (transfers are 1:1 with the
// generated payouts row, not re-derived from the plays table on a rerun of
// the same window). Run on a schedule that doesn't overlap windows.
const { db } = require("../db");
const { runPayoutForVenue } = require("../lib/stripe");

async function main() {
  const periodEndDate = new Date();
  const periodStartDate = new Date(periodEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const periodStart = periodStartDate.toISOString();
  const periodEnd = periodEndDate.toISOString();

  const venues = db.prepare("SELECT * FROM venues WHERE status = 'active'").all();
  console.log(`[payout] running for ${venues.length} venue(s), window ${periodStart} -> ${periodEnd}`);

  for (const venue of venues) {
    try {
      const result = await runPayoutForVenue(venue, periodStart, periodEnd);
      console.log(`[payout] ${venue.slug}:`, result);
    } catch (err) {
      console.error(`[payout] ${venue.slug} failed:`, err.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[payout] fatal error:", err);
    process.exit(1);
  });
