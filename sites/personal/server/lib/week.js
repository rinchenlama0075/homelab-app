// Posts store `created_at` as UTC `datetime('now')` strings, so week boundaries
// are computed in UTC too, with weeks starting on Monday.

// Returns the Monday 00:00 UTC that starts the week containing `date`, as a
// SQLite-comparable `datetime('now')`-style string ("YYYY-MM-DD HH:MM:SS").
function weekStartUtc(date) {
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day)
  );
  return monday.toISOString().slice(0, 19).replace("T", " ");
}

function startOfCurrentWeekSql() {
  return weekStartUtc(new Date());
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Given a week-start string (as produced by weekStartUtc), returns the
// week-start string for the week immediately before it.
function previousWeekStart(weekStartString) {
  const asDate = new Date(`${weekStartString.replace(" ", "T")}Z`);
  return weekStartUtc(new Date(asDate.getTime() - WEEK_MS));
}

module.exports = { startOfCurrentWeekSql, weekStartUtc, previousWeekStart };
