const express = require("express");
const { db } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { startOfCurrentWeekSql } = require("../lib/week");
const { computeStreak } = require("../lib/streaks");
const { evaluateAfterCommitmentCreated } = require("../lib/badges");

const router = express.Router();

const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;
const MIN_TARGET_PER_WEEK = 1;
const MAX_TARGET_PER_WEEK = 7;

function serializeCommitment(row) {
  const timestamps = db
    .prepare("SELECT created_at FROM posts WHERE commitment_id = ? AND type = 'check_in'")
    .all(row.id)
    .map((post) => post.created_at);
  const streak = computeStreak({ checkInTimestamps: timestamps, targetPerWeek: row.target_per_week });

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    targetPerWeek: row.target_per_week,
    createdAt: row.created_at,
    owner: { id: row.user_id, username: row.username },
    checkInsThisWeek: row.week_count,
    totalCheckIns: row.total_count,
    currentStreakWeeks: streak.currentStreakWeeks,
    longestStreakWeeks: streak.longestStreakWeeks,
    isAtRisk: streak.isAtRisk,
    checkInsNeededThisWeek: streak.checkInsNeededThisWeek,
  };
}

function selectCommitmentsSql(whereClause) {
  return `
    SELECT
      c.id, c.title, c.description, c.target_per_week, c.created_at, c.user_id,
      u.username,
      (SELECT COUNT(*) FROM posts p WHERE p.commitment_id = c.id AND p.type = 'check_in') AS total_count,
      (SELECT COUNT(*) FROM posts p WHERE p.commitment_id = c.id AND p.type = 'check_in' AND p.created_at >= ?) AS week_count
    FROM commitments c
    JOIN users u ON u.id = c.user_id
    ${whereClause}
    ORDER BY c.created_at DESC, c.id DESC
  `;
}

router.get("/", (req, res) => {
  const weekStart = startOfCurrentWeekSql();

  if (req.query.mine === "1") {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const rows = db
      .prepare(selectCommitmentsSql("WHERE c.user_id = ?"))
      .all(weekStart, req.user.id);
    return res.json({ commitments: rows.map(serializeCommitment) });
  }

  const rows = db.prepare(selectCommitmentsSql("")).all(weekStart);
  res.json({ commitments: rows.map(serializeCommitment) });
});

router.get("/:id", (req, res) => {
  const weekStart = startOfCurrentWeekSql();
  const row = db
    .prepare(selectCommitmentsSql("WHERE c.id = ?"))
    .get(weekStart, Number(req.params.id));

  if (!row) {
    return res.status(404).json({ error: "Commitment not found." });
  }

  res.json({ commitment: serializeCommitment(row) });
});

router.post("/", requireAuth, (req, res) => {
  const { title, description, targetPerWeek } = req.body || {};

  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
    return res.status(400).json({
      error: `Title is required and must be ${MAX_TITLE_LENGTH} characters or fewer.`,
    });
  }

  const trimmedDescription =
    typeof description === "string" ? description.trim() : "";
  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return res.status(400).json({
      error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
    });
  }

  const target = Number(targetPerWeek);
  if (
    !Number.isInteger(target) ||
    target < MIN_TARGET_PER_WEEK ||
    target > MAX_TARGET_PER_WEEK
  ) {
    return res.status(400).json({
      error: `Times per week must be a whole number between ${MIN_TARGET_PER_WEEK} and ${MAX_TARGET_PER_WEEK}.`,
    });
  }

  const result = db
    .prepare(
      "INSERT INTO commitments (user_id, title, description, target_per_week) VALUES (?, ?, ?, ?)"
    )
    .run(req.user.id, trimmedTitle, trimmedDescription || null, target);

  evaluateAfterCommitmentCreated(db, { user: req.user });

  const weekStart = startOfCurrentWeekSql();
  const row = db
    .prepare(selectCommitmentsSql("WHERE c.id = ?"))
    .get(weekStart, result.lastInsertRowid);

  res.status(201).json({ commitment: serializeCommitment(row) });
});

module.exports = router;
