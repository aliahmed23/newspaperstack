import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "10mb" }));

// resolve paths on Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// test endpoint for Zapier
app.post("/echo", (req, res) => {
  res.json({ ok: true, received: req.body });
});

// render HTML with injected variables (no PDF yet)
app.post("/render-issue", (req, res) => {
  const { title, issueNumber } = req.body;

  let html = fs.readFileSync(
    path.join(__dirname, "template.html"),
    "utf-8"
  );

  html = html
    .replace("{{TITLE}}", title || "Default Title")
    .replace("{{ISSUE_NUMBER}}", issueNumber || "1");

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});