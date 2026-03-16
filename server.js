import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const faqPath = path.join(__dirname, "faqs.json");

let faqs = [];
try {
  const raw = fs.readFileSync(faqPath, "utf8");
  faqs = JSON.parse(raw);
} catch (err) {
  console.error("Could not load faqs.json:", err);
}

const faqMap = new Map(
  faqs
    .filter((f) => f && f.id && f.a)
    .map((f) => [f.id, f])
);

app.get("/", (_req, res) => {
  res.send("A Quiet Architect API is running.");
});

app.get("/faqs", (_req, res) => {
  res.json(faqs);
});

app.post("/chat", (req, res) => {
  const intent = String(req.body?.intent || "").trim();

  if (!intent) {
    return res.json({
      reply: "How can I help today?"
    });
  }

  const faq = faqMap.get(intent);

  if (!faq) {
    return res.json({
      reply: "I don’t have that answer yet."
    });
  }

  return res.json({
    reply: faq.a
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});