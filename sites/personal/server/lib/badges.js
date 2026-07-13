const { computeStreak } = require("./streaks");

// Escalating streak badges: small, frequent rewards early (habit is fragile),
// bigger and rarer ones later. Milestone posts are only generated for
// streak/volume badges so the feed celebrates real achievements without
// getting cluttered by minor social badges.
const STREAK_BADGES = [
  { code: "streak_2", name: "Spark", emoji: "✨", threshold: 2, points: 25 },
  { code: "streak_4", name: "Ember", emoji: "🔥", threshold: 4, points: 40 },
  { code: "streak_8", name: "Flame", emoji: "🔥🔥", threshold: 8, points: 75 },
  { code: "streak_16", name: "Wildfire", emoji: "🔥🔥🔥", threshold: 16, points: 150 },
  { code: "streak_26", name: "Inferno", emoji: "🌋", threshold: 26, points: 250 },
  { code: "streak_52", name: "Phoenix", emoji: "🐦‍🔥", threshold: 52, points: 500 },
].map((badge) => ({
  ...badge,
  scope: "commitment",
  description: `${badge.threshold}-week streak`,
  postMilestone: true,
  check: (ctx) => ctx.currentStreakWeeks >= badge.threshold,
}));

const VOLUME_BADGES = [
  { code: "checkins_1", name: "First Step", emoji: "👟", threshold: 1, points: 10 },
  { code: "checkins_10", name: "Getting Going", emoji: "🚶", threshold: 10, points: 30 },
  { code: "checkins_50", name: "In The Groove", emoji: "🏃", threshold: 50, points: 75 },
  { code: "checkins_100", name: "Centurion", emoji: "💯", threshold: 100, points: 150 },
  { code: "checkins_365", name: "Century Club", emoji: "🏆", threshold: 365, points: 400 },
].map((badge) => ({
  ...badge,
  scope: "account",
  description: `${badge.threshold} check-in${badge.threshold === 1 ? "" : "s"} total`,
  postMilestone: true,
  check: (ctx) => ctx.totalCheckIns >= badge.threshold,
}));

const SOCIAL_BADGES = [
  {
    code: "cheerleader_25",
    name: "Cheerleader",
    emoji: "📣",
    scope: "account",
    threshold: 25,
    points: 40,
    description: "Liked 25 check-ins",
    postMilestone: false,
    check: (ctx) => ctx.likesGiven >= 25,
  },
  {
    code: "motivator_10",
    name: "Motivator",
    emoji: "💬",
    scope: "account",
    threshold: 10,
    points: 40,
    description: "Left 10 encouraging comments",
    postMilestone: false,
    check: (ctx) => ctx.commentsGiven >= 10,
  },
  {
    code: "explorer_3",
    name: "Explorer",
    emoji: "🧭",
    scope: "account",
    threshold: 3,
    points: 30,
    description: "Created 3 different commitments",
    postMilestone: false,
    check: (ctx) => ctx.commitmentsCreated >= 3,
  },
];

const COMEBACK_BADGE = {
  code: "comeback_kid",
  name: "Comeback Kid",
  emoji: "🔁",
  scope: "commitment",
  points: 60,
  description: "Bounced back and rebuilt a streak after a break",
  postMilestone: true,
  // Rewards resilience, not just perfection: fires once a commitment has
  // rebuilt at least a 2-week streak after previously having a longer one.
  check: (ctx) => ctx.longestStreakWeeks > ctx.currentStreakWeeks && ctx.currentStreakWeeks >= 2,
};

const BADGE_CATALOG = [...STREAK_BADGES, ...VOLUME_BADGES, ...SOCIAL_BADGES, COMEBACK_BADGE];

function badgeByCode(code) {
  return BADGE_CATALOG.find((badge) => badge.code === code);
}

function awardPoints(db, { userId, points, reason, postId = null, badgeCode = null }) {
  db.prepare(
    "INSERT INTO points_ledger (user_id, points, reason, post_id, badge_code) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, points, reason, postId, badgeCode);
}

function getTotalPoints(db, userId) {
  const row = db
    .prepare("SELECT COALESCE(SUM(points), 0) AS total FROM points_ledger WHERE user_id = ?")
    .get(userId);
  return row.total;
}

function createMilestonePost(db, { user, badge, commitment, streakWeeks }) {
  const caption =
    badge.scope === "commitment"
      ? `${badge.emoji} ${user.username} just hit a ${streakWeeks}-week streak on "${commitment.title}"! Unlocked "${badge.name}".`
      : `${badge.emoji} ${user.username} just unlocked "${badge.name}" — ${badge.description}!`;

  const milestoneMeta = JSON.stringify({
    badgeCode: badge.code,
    badgeName: badge.name,
    emoji: badge.emoji,
    description: badge.description,
    streakWeeks: badge.scope === "commitment" ? streakWeeks : null,
    commitmentId: commitment ? commitment.id : null,
    commitmentTitle: commitment ? commitment.title : null,
  });

  const result = db
    .prepare(
      `INSERT INTO posts (user_id, image_filename, caption, commitment_id, type, milestone_meta)
       VALUES (?, '', ?, ?, 'milestone', ?)`
    )
    .run(user.id, caption, commitment ? commitment.id : null, milestoneMeta);

  return result.lastInsertRowid;
}

function alreadyEarned(db, { userId, commitmentId, badgeCode }) {
  const row = db
    .prepare(
      `SELECT id FROM user_badges
       WHERE user_id = ? AND badge_code = ? AND (commitment_id = ? OR (commitment_id IS NULL AND ? IS NULL))`
    )
    .get(userId, badgeCode, commitmentId, commitmentId);
  return Boolean(row);
}

function grantBadge(db, { user, badge, commitmentId = null, commitment = null, streakWeeks = null }) {
  if (alreadyEarned(db, { userId: user.id, commitmentId, badgeCode: badge.code })) {
    return null;
  }

  db.prepare(
    "INSERT INTO user_badges (user_id, commitment_id, badge_code) VALUES (?, ?, ?)"
  ).run(user.id, commitmentId, badge.code);

  let milestonePostId = null;
  if (badge.postMilestone) {
    milestonePostId = createMilestonePost(db, { user, badge, commitment, streakWeeks });
  }

  awardPoints(db, {
    userId: user.id,
    points: badge.points,
    reason: `Unlocked badge: ${badge.name}`,
    postId: milestonePostId,
    badgeCode: badge.code,
  });

  return { ...badge, commitmentId, earnedAt: new Date().toISOString() };
}

// Call after a check-in is created for `commitment`. Awards points for the
// check-in itself, then evaluates commitment-scoped and account-scoped
// badges that depend on check-in activity.
function evaluateAfterCheckIn(db, { user, commitment, postId }) {
  const newlyEarned = [];

  const weekStartSql = require("./week").startOfCurrentWeekSql();
  const checkInsThisWeek = db
    .prepare("SELECT COUNT(*) AS count FROM posts WHERE commitment_id = ? AND type = 'check_in' AND created_at >= ?")
    .get(commitment.id, weekStartSql).count;

  awardPoints(db, {
    userId: user.id,
    points: 10,
    reason: `Checked in on "${commitment.title}"`,
    postId,
  });

  if (checkInsThisWeek === commitment.targetPerWeek) {
    awardPoints(db, {
      userId: user.id,
      points: 15,
      reason: `Hit this week's target on "${commitment.title}"`,
      postId,
    });
  }

  const timestamps = db
    .prepare("SELECT created_at FROM posts WHERE commitment_id = ? AND type = 'check_in'")
    .all(commitment.id)
    .map((row) => row.created_at);

  const streak = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: commitment.targetPerWeek });

  for (const badge of [...STREAK_BADGES, COMEBACK_BADGE]) {
    if (badge.check(streak)) {
      const earned = grantBadge(db, {
        user,
        badge,
        commitmentId: commitment.id,
        commitment,
        streakWeeks: streak.currentStreakWeeks,
      });
      if (earned) newlyEarned.push(earned);
    }
  }

  const totalCheckIns = db
    .prepare("SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND type = 'check_in'")
    .get(user.id).count;

  for (const badge of VOLUME_BADGES) {
    if (badge.check({ totalCheckIns })) {
      const earned = grantBadge(db, { user, badge });
      if (earned) newlyEarned.push(earned);
    }
  }

  return newlyEarned;
}

function evaluateAfterLike(db, { user }) {
  const likesGiven = db.prepare("SELECT COUNT(*) AS count FROM likes WHERE user_id = ?").get(user.id).count;
  const badge = badgeByCode("cheerleader_25");
  if (badge.check({ likesGiven })) {
    return grantBadge(db, { user, badge });
  }
  return null;
}

function evaluateAfterComment(db, { user }) {
  const commentsGiven = db
    .prepare("SELECT COUNT(*) AS count FROM comments WHERE user_id = ?")
    .get(user.id).count;
  const badge = badgeByCode("motivator_10");
  if (badge.check({ commentsGiven })) {
    return grantBadge(db, { user, badge });
  }
  return null;
}

function evaluateAfterCommitmentCreated(db, { user }) {
  const commitmentsCreated = db
    .prepare("SELECT COUNT(*) AS count FROM commitments WHERE user_id = ?")
    .get(user.id).count;
  const badge = badgeByCode("explorer_3");
  if (badge.check({ commitmentsCreated })) {
    return grantBadge(db, { user, badge });
  }
  return null;
}

function getEarnedBadges(db, userId) {
  return db
    .prepare(
      `SELECT ub.badge_code, ub.commitment_id, ub.earned_at, c.title AS commitment_title
       FROM user_badges ub
       LEFT JOIN commitments c ON c.id = ub.commitment_id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`
    )
    .all(userId)
    .map((row) => {
      const badge = badgeByCode(row.badge_code);
      return {
        ...badge,
        commitmentId: row.commitment_id,
        commitmentTitle: row.commitment_title,
        earnedAt: row.earned_at,
      };
    });
}

module.exports = {
  BADGE_CATALOG,
  STREAK_BADGES,
  VOLUME_BADGES,
  SOCIAL_BADGES,
  COMEBACK_BADGE,
  badgeByCode,
  awardPoints,
  getTotalPoints,
  getEarnedBadges,
  evaluateAfterCheckIn,
  evaluateAfterLike,
  evaluateAfterComment,
  evaluateAfterCommitmentCreated,
};
