import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "10mb" }));

// needed to resolve file paths on Render
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

// placeholder for PDF render later
app.post("/render-issue", (req, res) => {
  res.json({
    ok: true,
    message: "HTML + CSS loading works. PDF rendering next.",
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});