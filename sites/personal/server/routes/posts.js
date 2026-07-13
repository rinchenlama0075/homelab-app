const express = require("express");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { db, UPLOADS_DIR } = require("../db");
const { requireAuth } = require("../middleware/auth");
const {
  evaluateAfterCheckIn,
  evaluateAfterLike,
  evaluateAfterComment,
} = require("../lib/badges");

const router = express.Router();

const MAX_CAPTION_LENGTH = 280;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || "";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed."));
    }
    cb(null, true);
  },
});

function serializePost(row, currentUserId) {
  const isMilestone = row.type === "milestone";
  return {
    id: row.id,
    type: row.type || "check_in",
    caption: row.caption,
    imageUrl: isMilestone ? null : `/api/uploads/${row.image_filename}`,
    milestone: isMilestone && row.milestone_meta ? JSON.parse(row.milestone_meta) : null,
    createdAt: row.created_at,
    author: { id: row.user_id, username: row.username },
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: currentUserId ? row.liked_by_me === 1 : false,
    commitment: row.commitment_id
      ? { id: row.commitment_id, title: row.commitment_title, targetPerWeek: row.commitment_target_per_week }
      : null,
  };
}

const SELECT_POST_FIELDS = `
  p.id, p.caption, p.image_filename, p.created_at, p.user_id, p.type, p.milestone_meta,
  u.username,
  p.commitment_id, cm.title AS commitment_title, cm.target_per_week AS commitment_target_per_week
`;

router.get("/", (req, res) => {
  const userId = req.user?.id || 0;
  const commitmentId = req.query.commitmentId ? Number(req.query.commitmentId) : null;

  const rows = db
    .prepare(
      `SELECT
        ${SELECT_POST_FIELDS},
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN commitments cm ON cm.id = p.commitment_id
      ${commitmentId ? "WHERE p.commitment_id = ?" : ""}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 50`
    )
    .all(...(commitmentId ? [userId, commitmentId] : [userId]));

  res.json({ posts: rows.map((row) => serializePost(row, req.user?.id)) });
});

router.post("/", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "An image is required." });
  }

  const commitmentId = Number(req.body.commitmentId);
  if (!Number.isInteger(commitmentId) || commitmentId <= 0) {
    return res.status(400).json({ error: "A commitment is required to check in." });
  }

  const commitmentRow = db
    .prepare("SELECT id, user_id, title, target_per_week FROM commitments WHERE id = ?")
    .get(commitmentId);
  if (!commitmentRow) {
    return res.status(404).json({ error: "Commitment not found." });
  }
  if (commitmentRow.user_id !== req.user.id) {
    return res.status(403).json({ error: "You can only check in on your own commitments." });
  }
  const commitment = {
    id: commitmentRow.id,
    userId: commitmentRow.user_id,
    title: commitmentRow.title,
    targetPerWeek: commitmentRow.target_per_week,
  };

  const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
  if (!caption) {
    return res.status(400).json({ error: "Add a comment about your check-in." });
  }
  if (caption.length > MAX_CAPTION_LENGTH) {
    return res
      .status(400)
      .json({ error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer.` });
  }

  const result = db
    .prepare(
      "INSERT INTO posts (user_id, image_filename, caption, commitment_id, type) VALUES (?, ?, ?, ?, 'check_in')"
    )
    .run(req.user.id, req.file.filename, caption, commitmentId);

  const badgesEarned = evaluateAfterCheckIn(db, {
    user: req.user,
    commitment,
    postId: result.lastInsertRowid,
  });

  const row = db
    .prepare(
      `SELECT ${SELECT_POST_FIELDS},
        0 AS like_count, 0 AS comment_count, 0 AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN commitments cm ON cm.id = p.commitment_id
       WHERE p.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json({
    post: serializePost(row, req.user.id),
    badgesEarned: badgesEarned.map((badge) => ({
      code: badge.code,
      name: badge.name,
      emoji: badge.emoji,
      description: badge.description,
    })),
  });
});

router.post("/:id/like", requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  const existing = db
    .prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?")
    .get(postId, req.user.id);

  let badgeEarned = null;
  if (existing) {
    db.prepare("DELETE FROM likes WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(postId, req.user.id);
    badgeEarned = evaluateAfterLike(db, { user: req.user });
  }

  const likeCount = db
    .prepare("SELECT COUNT(*) AS count FROM likes WHERE post_id = ?")
    .get(postId).count;

  res.json({
    liked: !existing,
    likeCount,
    badgeEarned: badgeEarned
      ? { code: badgeEarned.code, name: badgeEarned.name, emoji: badgeEarned.emoji }
      : null,
  });
});

router.get("/:id/comments", (req, res) => {
  const postId = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.user_id, u.username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC, c.id ASC`
    )
    .all(postId);

  res.json({
    comments: rows.map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      author: { id: row.user_id, username: row.username },
    })),
  });
});

router.post("/:id/comments", requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
  if (!body) {
    return res.status(400).json({ error: "Comment cannot be empty." });
  }
  if (body.length > MAX_CAPTION_LENGTH) {
    return res
      .status(400)
      .json({ error: `Comment must be ${MAX_CAPTION_LENGTH} characters or fewer.` });
  }

  const result = db
    .prepare("INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)")
    .run(postId, req.user.id, body);

  const badgeEarned = evaluateAfterComment(db, { user: req.user });

  const row = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.user_id, u.username
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json({
    comment: {
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      author: { id: row.user_id, username: row.username },
    },
    badgeEarned: badgeEarned
      ? { code: badgeEarned.code, name: badgeEarned.name, emoji: badgeEarned.emoji }
      : null,
  });
});

module.exports = router;
