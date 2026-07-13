const test = require("node:test");
const assert = require("node:assert/strict");
const { computeStreak } = require("./streaks");
const { weekStartUtc } = require("./week");

// Friday, so "at risk" checks (which only fire from Friday onward) are
// deterministic regardless of when the test suite actually runs.
const NOW = new Date("2026-07-17T12:00:00Z");
const CURRENT_WEEK_START = new Date(`${weekStartUtc(NOW).replace(" ", "T")}Z`);

function timestampInWeek(weeksAgo, dayOfWeek) {
  const weekStart = new Date(CURRENT_WEEK_START.getTime() - weeksAgo * 7 * 86400000);
  const day = new Date(weekStart.getTime() + dayOfWeek * 86400000 + 12 * 3600000);
  return day.toISOString().slice(0, 19).replace("T", " ");
}

test("no check-ins yields a zeroed-out streak", () => {
  const result = computeStreak({ checkInTimestamps: [], targetPerWeek: 3, now: NOW });
  assert.deepEqual(result, {
    currentStreakWeeks: 0,
    longestStreakWeeks: 0,
    isAtRisk: false,
    checkInsNeededThisWeek: 3,
    checkInsThisWeek: 0,
  });
});

test("a perfect run of completed weeks counts as a streak, including the current week once met", () => {
  const timestamps = [];
  for (const weeksAgo of [2, 1, 0]) {
    timestamps.push(timestampInWeek(weeksAgo, 0), timestampInWeek(weeksAgo, 2));
  }
  const result = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: 2, now: NOW });
  assert.equal(result.currentStreakWeeks, 3);
  assert.equal(result.longestStreakWeeks, 3);
  assert.equal(result.checkInsNeededThisWeek, 0);
});

test("an unfinished current week neither counts nor breaks the streak", () => {
  const timestamps = [];
  for (const weeksAgo of [2, 1]) {
    timestamps.push(timestampInWeek(weeksAgo, 0), timestampInWeek(weeksAgo, 2));
  }
  // Current week: only 1 of 2 needed check-ins so far.
  timestamps.push(timestampInWeek(0, 0));

  const result = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: 2, now: NOW });
  assert.equal(result.currentStreakWeeks, 2, "streak from prior completed weeks still stands");
  assert.equal(result.checkInsNeededThisWeek, 1);
});

test("a commitment is flagged at-risk once its streak is on the line late in the week", () => {
  const timestamps = [];
  for (const weeksAgo of [4, 3, 2, 1]) {
    timestamps.push(timestampInWeek(weeksAgo, 0), timestampInWeek(weeksAgo, 2));
  }
  timestamps.push(timestampInWeek(0, 0)); // only 1 of 2 this week, and it's Friday

  const result = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: 2, now: NOW });
  assert.equal(result.currentStreakWeeks, 4);
  assert.equal(result.isAtRisk, true);
});

test("hitting this week's target extends the streak and clears the at-risk flag", () => {
  const timestamps = [];
  for (const weeksAgo of [4, 3, 2, 1]) {
    timestamps.push(timestampInWeek(weeksAgo, 0), timestampInWeek(weeksAgo, 2));
  }
  timestamps.push(timestampInWeek(0, 0), timestampInWeek(0, 2));

  const result = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: 2, now: NOW });
  assert.equal(result.currentStreakWeeks, 5);
  assert.equal(result.isAtRisk, false);
});

test("no streak yet means nothing is 'at risk', even if behind pace", () => {
  const timestamps = [timestampInWeek(0, 0)];
  const result = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: 3, now: NOW });
  assert.equal(result.currentStreakWeeks, 0);
  assert.equal(result.isAtRisk, false);
});

test("a gap resets the streak but the longest streak on record is preserved", () => {
  // 3 weeks ago: met. 2 weeks ago: missed entirely (gap). 1 and 0 weeks ago: met.
  const timestamps = [
    timestampInWeek(3, 0),
    timestampInWeek(3, 2),
    timestampInWeek(1, 0),
    timestampInWeek(1, 2),
    timestampInWeek(0, 0),
    timestampInWeek(0, 2),
  ];
  const result = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: 2, now: NOW });
  assert.equal(result.currentStreakWeeks, 2);
  assert.equal(result.longestStreakWeeks, 2);
});
