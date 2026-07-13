const express = require("express");
const { db } = require("../db");
const { startOfCurrentWeekSql } = require("../lib/week");
const { computeStreak } = require("../lib/streaks");
const {
  getTotalPoints,
  getEarnedBadges,
  STREAK_BADGES,
  VOLUME_BADGES,
} = require("../lib/badges");

const router = express.Router();

function serializeCommitmentWithStreak(row, weekStart) {
  const timestamps = db
    .prepare("SELECT created_at FROM posts WHERE commitment_id = ? AND type = 'check_in'")
    .all(row.id)
    .map((post) => post.created_at);
  const streak = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: row.target_per_week });
  const checkInsThisWeek = timestamps.filter((timestamp) => timestamp >= weekStart).length;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    targetPerWeek: row.target_per_week,
    createdAt: row.created_at,
    checkInsThisWeek,
    totalCheckIns: timestamps.length,
    currentStreakWeeks: streak.currentStreakWeeks,
    longestStreakWeeks: streak.longestStreakWeeks,
    isAtRisk: streak.isAtRisk,
    checkInsNeededThisWeek: streak.checkInsNeededThisWeek,
  };
}

// For each of a user's active commitments, finds the smallest streak badge
// they haven't unlocked yet and how many weeks away it is — the "almost
// there" teaser that makes the next reward feel reachable.
function nextStreakBadgeTeasers(commitments, earnedBadgeCodes) {
  const teasers = [];
  for (const commitment of commitments) {
    const next = STREAK_BADGES.find(
      (badge) =>
        badge.threshold > commitment.currentStreakWeeks &&
        !earnedBadgeCodes.has(`${badge.code}:${commitment.id}`)
    );
    if (next) {
      teasers.push({
        commitmentId: commitment.id,
        commitmentTitle: commitment.title,
        badgeCode: next.code,
        badgeName: next.name,
        emoji: next.emoji,
        weeksAway: next.threshold - commitment.currentStreakWeeks,
      });
    }
  }
  return teasers.sort((a, b) => a.weeksAway - b.weeksAway);
}

function nextVolumeBadgeTeaser(totalCheckIns, earnedBadgeCodes) {
  const next = VOLUME_BADGES.find(
    (badge) => badge.threshold > totalCheckIns && !earnedBadgeCodes.has(`${badge.code}:account`)
  );
  if (!next) return null;
  return {
    badgeCode: next.code,
    badgeName: next.name,
    emoji: next.emoji,
    checkInsAway: next.threshold - totalCheckIns,
  };
}

router.get("/:username", (req, res) => {
  const user = db
    .prepare("SELECT id, username, created_at FROM users WHERE username = ?")
    .get(req.params.username);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const weekStart = startOfCurrentWeekSql();

  const commitmentRows = db
    .prepare(
      "SELECT id, title, description, target_per_week, created_at FROM commitments WHERE user_id = ? ORDER BY created_at DESC, id DESC"
    )
    .all(user.id);
  const commitments = commitmentRows.map((row) => serializeCommitmentWithStreak(row, weekStart));

  const totalCheckIns = db
    .prepare("SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND type = 'check_in'")
    .get(user.id).count;

  const earnedBadges = getEarnedBadges(db, user.id);
  const earnedBadgeCodes = new Set(
    earnedBadges.map((badge) => `${badge.code}:${badge.commitmentId ?? "account"}`)
  );

  const activeStreaks = commitments.filter((c) => c.currentStreakWeeks > 0);
  const atRiskCommitments = commitments.filter((c) => c.isAtRisk);
  const longestEverStreak = commitments.reduce(
    (max, c) => Math.max(max, c.longestStreakWeeks),
    0
  );

  res.json({
    user: { id: user.id, username: user.username, createdAt: user.created_at },
    stats: {
      totalPoints: getTotalPoints(db, user.id),
      totalCheckIns,
      badgeCount: earnedBadges.length,
      activeStreakCount: activeStreaks.length,
      longestEverStreak,
      atRiskCount: atRiskCommitments.length,
    },
    badges: earnedBadges,
    nextBadges: {
      streaks: nextStreakBadgeTeasers(commitments, earnedBadgeCodes),
      volume: nextVolumeBadgeTeaser(totalCheckIns, earnedBadgeCodes),
    },
    commitments,
  });
});

module.exports = router;
