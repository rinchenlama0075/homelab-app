// Posts store `created_at` as UTC `datetime('now')` strings, so week boundaries
// are computed in UTC too, with weeks starting on Monday.
function startOfCurrentWeekSql() {
  const now = new Date();
  const day = (now.getUTCDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day)
  );
  return monday.toISOString().slice(0, 19).replace("T", " ");
}

module.exports = { startOfCurrentWeekSql };
