const { weekStartUtc, previousWeekStart } = require("./week");

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// A week only starts feeling "at risk" once its second half has begun —
// no point nagging someone on Monday about a target due Sunday night.
const AT_RISK_FROM_DAY_INDEX = 4; // Friday (Monday = 0)

/**
 * Computes streak/at-risk state for a single commitment from its raw
 * check-in timestamps. Pure function so it's easy to unit test with
 * synthetic data.
 *
 * @param {Object} params
 * @param {string[]} params.checkInTimestamps - `created_at` strings (any order) for every check-in against this commitment.
 * @param {number} params.targetPerWeek - the commitment's weekly target.
 * @param {Date} [params.now] - defaults to the current time; override in tests.
 * @returns {{
 *   currentStreakWeeks: number,
 *   longestStreakWeeks: number,
 *   isAtRisk: boolean,
 *   checkInsNeededThisWeek: number,
 *   checkInsThisWeek: number,
 * }}
 */
function computeStreak({ checkInTimestamps, targetPerWeek, now = new Date() }) {
  const countsByWeekStart = new Map();
  for (const timestamp of checkInTimestamps) {
    const parsed = new Date(`${timestamp.replace(" ", "T")}Z`);
    if (Number.isNaN(parsed.getTime())) continue;
    const weekStart = weekStartUtc(parsed);
    countsByWeekStart.set(weekStart, (countsByWeekStart.get(weekStart) || 0) + 1);
  }

  const currentWeekStart = weekStartUtc(now);
  const checkInsThisWeek = countsByWeekStart.get(currentWeekStart) || 0;
  const checkInsNeededThisWeek = Math.max(0, targetPerWeek - checkInsThisWeek);
  const currentWeekMet = checkInsThisWeek >= targetPerWeek;

  if (countsByWeekStart.size === 0) {
    return {
      currentStreakWeeks: 0,
      longestStreakWeeks: 0,
      isAtRisk: false,
      checkInsNeededThisWeek,
      checkInsThisWeek,
    };
  }

  // Build a week-by-week "met target?" series from the earliest check-in's
  // week through the last *decided* week. An in-progress current week that
  // hasn't hit target yet is excluded — it hasn't failed, it's just not over.
  const earliestWeekStart = [...countsByWeekStart.keys()].sort()[0];
  const lastDecidedWeekStart = currentWeekMet
    ? currentWeekStart
    : previousWeekStart(currentWeekStart);

  const metSeries = [];
  if (lastDecidedWeekStart >= earliestWeekStart) {
    let cursor = earliestWeekStart;
    while (cursor <= lastDecidedWeekStart) {
      const count = countsByWeekStart.get(cursor) || 0;
      metSeries.push(count >= targetPerWeek);
      cursor = nextWeekStart(cursor);
    }
  }

  let longestStreakWeeks = 0;
  let runningStreak = 0;
  for (const met of metSeries) {
    runningStreak = met ? runningStreak + 1 : 0;
    longestStreakWeeks = Math.max(longestStreakWeeks, runningStreak);
  }

  // Current streak is just the trailing run at the end of the series.
  let currentStreakWeeks = 0;
  for (let i = metSeries.length - 1; i >= 0; i -= 1) {
    if (!metSeries[i]) break;
    currentStreakWeeks += 1;
  }

  const streakGoingIntoThisWeek = currentWeekMet
    ? currentStreakWeeks - 1
    : currentStreakWeeks;
  const daysElapsedInWeek = Math.floor((now.getTime() - toDate(currentWeekStart).getTime()) / DAY_MS);
  const isAtRisk =
    !currentWeekMet &&
    streakGoingIntoThisWeek > 0 &&
    daysElapsedInWeek >= AT_RISK_FROM_DAY_INDEX;

  return {
    currentStreakWeeks,
    longestStreakWeeks,
    isAtRisk,
    checkInsNeededThisWeek,
    checkInsThisWeek,
  };
}

function nextWeekStart(weekStartString) {
  return weekStartUtc(new Date(toDate(weekStartString).getTime() + WEEK_MS));
}

function toDate(weekStartString) {
  return new Date(`${weekStartString.replace(" ", "T")}Z`);
}

module.exports = { computeStreak };
