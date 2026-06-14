const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "homelab-app",
    message: "Deployed via GitHub Actions to homelab",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`homelab-app listening on ${port}`);
});
