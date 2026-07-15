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

// Plain "YYYY-MM-DD" for "today" in UTC — used for commitment end dates,
// which are calendar days rather than precise timestamps.
function todayUtcDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

// Whole calendar days between today (UTC) and `endDateString` ("YYYY-MM-DD").
// Positive means the end date is still upcoming, 0 means it's today, negative
// means it has already passed. `endDateString` may be null, in which case
// this returns null (the commitment is open-ended).
function daysUntil(endDateString, now = new Date()) {
  if (!endDateString) return null;
  const today = new Date(`${todayUtcDate(now)}T00:00:00Z`);
  const end = new Date(`${endDateString}T00:00:00Z`);
  return Math.round((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

module.exports = { startOfCurrentWeekSql, weekStartUtc, previousWeekStart, todayUtcDate, daysUntil };
