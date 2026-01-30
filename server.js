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

// render HTML with injected variables
app.post("/render-issue", (req, res) => {
  const { title, issueNumber } = req.body;

  let html = fs.readFileSync(
    path.join(__dirname, "index.html"),
    "utf-8"
  );

  html = html
    .replace("{{TITLE}}", title || "Default Title")
    .replace("{{ISSUE_NUMBER}}", issueNumber || "1");

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// render PDF
// render PDF from provided HTML (no variable injection here)
app.post("/render-pdf", async (req, res) => {
    try {
      const token = process.env.BROWSERLESS_TOKEN;
      if (!token) {
        return res.status(500).json({ ok: false, error: "Missing BROWSERLESS_TOKEN env var." });
      }
  
      const { html } = req.body;
      if (!html || typeof html !== "string") {
        return res.status(400).json({ ok: false, error: "Missing `html` string in request body." });
      }
  
      const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${token}`;
  
      const resp = await fetch(browserlessUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          options: {
            format: "Letter",
            printBackground: true,
            margin: {
              top: "0.5in",
              right: "0.5in",
              bottom: "0.5in",
              left: "0.5in",
            },
          },
        }),
      });
  
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({
          ok: false,
          error: "Browserless PDF render failed.",
          status: resp.status,
          details: text.slice(0, 1000),
        });
      }
  
      const pdfBuffer = Buffer.from(await resp.arrayBuffer());
  
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="issue.pdf"');
      res.send(pdfBuffer);
    } catch (err) {
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});