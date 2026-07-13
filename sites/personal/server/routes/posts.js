const express = require("express");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { db, UPLOADS_DIR } = require("../db");
const { requireAuth } = require("../middleware/auth");

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
  return {
    id: row.id,
    caption: row.caption,
    imageUrl: `/api/uploads/${row.image_filename}`,
    createdAt: row.created_at,
    author: { id: row.user_id, username: row.username },
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: currentUserId ? row.liked_by_me === 1 : false,
  };
}

router.get("/", (req, res) => {
  const userId = req.user?.id || 0;
  const rows = db
    .prepare(
      `SELECT
        p.id, p.caption, p.image_filename, p.created_at, p.user_id,
        u.username,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 50`
    )
    .all(userId);

  res.json({ posts: rows.map((row) => serializePost(row, req.user?.id)) });
});

router.post("/", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "An image is required." });
  }

  const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
  if (caption.length > MAX_CAPTION_LENGTH) {
    return res
      .status(400)
      .json({ error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer.` });
  }

  const result = db
    .prepare("INSERT INTO posts (user_id, image_filename, caption) VALUES (?, ?, ?)")
    .run(req.user.id, req.file.filename, caption || null);

  const row = db
    .prepare(
      `SELECT p.id, p.caption, p.image_filename, p.created_at, p.user_id, u.username,
        0 AS like_count, 0 AS comment_count, 0 AS liked_by_me
       FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ post: serializePost(row, req.user.id) });
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

  if (existing) {
    db.prepare("DELETE FROM likes WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(postId, req.user.id);
  }

  const likeCount = db
    .prepare("SELECT COUNT(*) AS count FROM likes WHERE post_id = ?")
    .get(postId).count;

  res.json({ liked: !existing, likeCount });
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
  });
});

module.exports = router;
