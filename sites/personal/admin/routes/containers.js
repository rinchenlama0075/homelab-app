const express = require("express");
const { requireAdminSession } = require("../middleware/adminAuth");
const { listContainers, getContainerLogs } = require("../lib/dockerProxy");

const router = express.Router();

const MAX_TAIL = 1000;
const DEFAULT_TAIL = 200;

router.get("/containers", requireAdminSession, async (_req, res) => {
  try {
    res.json({ containers: await listContainers() });
  } catch (err) {
    res.status(502).json({ error: `Could not reach docker-proxy: ${err.message}` });
  }
});

// :name is validated against the live container list below, so it can never
// be used to reach an arbitrary container id/path on the docker-proxy.
router.get("/containers/:name/logs", requireAdminSession, async (req, res) => {
  const tail = Math.min(MAX_TAIL, Math.max(1, Number(req.query.tail) || DEFAULT_TAIL));

  let containers;
  try {
    containers = await listContainers();
  } catch (err) {
    return res.status(502).json({ error: `Could not reach docker-proxy: ${err.message}` });
  }

  const container = containers.find((c) => c.name === req.params.name);
  if (!container) {
    return res.status(404).json({ error: "Unknown container." });
  }

  try {
    const logs = await getContainerLogs(container.id, tail);
    res.type("text/plain").send(logs);
  } catch (err) {
    res.status(502).json({ error: `Could not fetch logs: ${err.message}` });
  }
});

module.exports = router;
