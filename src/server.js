const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Hello World</title></head>
<body><h1>Hello World</h1></body>
</html>`);
});

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`homelab-app listening on ${port}`);
});
