const express = require("express");
const { requireAdminSession } = require("../middleware/adminAuth");
const { listContainers, COMPOSE_PROJECT } = require("../lib/dockerProxy");

const router = express.Router();

router.get("/status", requireAdminSession, async (_req, res) => {
  const base = {
    now: new Date().toISOString(),
    project: COMPOSE_PROJECT,
    admin: {
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
    },
  };

  try {
    base.containers = await listContainers();
  } catch (err) {
    base.containers = [];
    base.containersError = err.message;
  }

  res.json(base);
});

module.exports = router;
