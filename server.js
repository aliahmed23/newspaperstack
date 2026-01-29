import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

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
    const { html, issueNumber } = req.body;
  
    if (!html || typeof html !== "string") {
      return res.status(400).json({ ok: false, error: "Missing `html` string in body." });
    }
  
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
  
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });
  
    await browser.close();
  
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Issue-${issueNumber || 1}.pdf"`
    );
    res.send(pdf);
  }); 

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});