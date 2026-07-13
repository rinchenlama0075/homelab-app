const express = require("express");
const cookieParser = require("cookie-parser");
const { UPLOADS_DIR } = require("./db");
const { attachUser } = require("./middleware/auth");
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const commitmentsRouter = require("./routes/commitments");
const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.get("/api/health", (_req, res) => res.type("text").send("ok"));

app.use("/api/auth", authRouter);
app.use("/api/commitments", commitmentsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);
app.use("/api/uploads", express.static(UPLOADS_DIR));

app.use((err, _req, res, _next) => {
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`Social API listening on port ${PORT}`);
});
