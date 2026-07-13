const express = require("express");
const fs = require("fs");
const path = require("path");
const { requireAdminSession } = require("../middleware/adminAuth");

const router = express.Router();

// Populated by infra/deploy-site.sh and infra/monitoring/check-health.sh on
// the host, bind-mounted read-only into this container. Both routes degrade
// gracefully (empty results, not errors) if the mount or files don't exist
// yet — e.g. before the Server side of Server-Dev-chat.md's steps land.
const STATE_DIR = process.env.STATE_DIR || "/app/state";
const HEALTH_LOG_MAX_LINES = 200;

router.get("/deploys", requireAdminSession, async (_req, res) => {
  let entries = [];
  try {
    const files = (await fs.promises.readdir(STATE_DIR)).filter((f) => f.endsWith(".json"));
    entries = await Promise.all(
      files.map(async (file) => {
        try {
          const raw = await fs.promises.readFile(path.join(STATE_DIR, file), "utf8");
          return { site: path.basename(file, ".json"), ...JSON.parse(raw) };
        } catch {
          return { site: path.basename(file, ".json"), status: "unknown" };
        }
      })
    );
  } catch {
    // STATE_DIR doesn't exist yet — nothing deployed via infra/ scripts so far.
  }

  entries.sort((a, b) => (b.deployedAt || "").localeCompare(a.deployedAt || ""));
  res.json({ deploys: entries });
});

router.get("/health-history", requireAdminSession, async (_req, res) => {
  let lines = [];
  try {
    const raw = await fs.promises.readFile(path.join(STATE_DIR, "health.jsonl"), "utf8");
    lines = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    // health.jsonl doesn't exist yet.
  }

  res.json({ checks: lines.slice(-HEALTH_LOG_MAX_LINES).reverse() });
});

module.exports = router;
