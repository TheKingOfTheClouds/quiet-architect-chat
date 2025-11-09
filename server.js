// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const app = express();

// ----- CORS -----
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.options("*", cors());
app.use(bodyParser.json());

// ----- Load FAQs (optional but recommended) -----
const FAQ_PATH = path.join(process.cwd(), "faqs.json");
let FAQS = [];
try {
  if (fs.existsSync(FAQ_PATH)) {
    FAQS = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));
    if (!Array.isArray(FAQS)) FAQS = [];
  }
} catch (e) {
  console.error("Failed to load faqs.json:", e);
}

// naive keyword scorer (fast, no embeddings)
function scoreFaq(query, faq) {
  const q = String(query || "").toLowerCase();
  const text = (faq.q + " " + faq.a).toLowerCase();
  // overlap by words
  const terms = q.split(/[^a-z0-9]+/).filter(Boolean);
  return terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
}
function topFaqs(query, k = 3) {
  if (!FAQS.length) return [];
  return [...FAQS]
    .map((f) => ({ f, s: scoreFaq(query, f) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .filter((x) => x.s > 0)
    .map((x) => x.f);
}

// ----- OpenAI (optional; graceful fallback without it) -----
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// simple in-memory session memory
const sessions = new Map(); // sessionId -> [{role, content}]

// ----- Routes -----
app.get("/", (_, res) => res.send("A Quiet Architect API is running..."));

app.post("/chat", async (req, res) => {
  const { message = "", meta = {}, sessionId = "anon" } = req.body || {};
  const userMsg = String(message).trim();
  if (!userMsg) return res.json({ reply: "Say that again?" });

  try {
    // pick FAQ context
    const matches = topFaqs(userMsg, 3);
    const faqContext = matches
      .map((f, i) => `FAQ #${i + 1}\nQ: ${f.q}\nA: ${f.a}`)
      .join("\n\n");

    // conversation history
    const history = sessions.get(sessionId) || [];

    // brand voice / personality
    const systemPrompt = `
You are "Architect" — the voice, mind, and presence of A Quiet Architect.

Purpose:
Guide people with calm precision. Simplify chaos. Design systems that flow.
You are warm, confident, and human — never waste words.

Personality:
- Expert in creativity + technology.
- Short, grounded sentences. No fluff.
- Calm, unhurried, controlled mastery.
- Sound like someone who designs systems that “just work.”
- Invite an intro call when appropriate (natural, not pushy).

Style:
- Elegant brevity; handcrafted phrasing.
- One thought → line break → next insight.
- Use short lists for clarity when helpful.
- Never robotic, salesy, or “coachy.”
- Always close loops.

Brand context:
We design brands, websites, and automation systems that operate seamlessly — invisible but effective.
Audience: small business owners, creatives, professionals seeking simplicity and cohesion.

Relevant FAQs (may be empty):
${faqContext || "(no strong FAQ matches)"}
`.trim();

    let replyText =
      `You said: ${userMsg}. ` +
      `Want me to book a quick intro call so we can scope exactly what you need?`;

    if (openai) {
      const msgs = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMsg },
      ];

      const out = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: msgs,
      });

      replyText = out.choices?.[0]?.message?.content?.trim() || replyText;
    }

    // update memory (cap to ~12 turns)
    const newHistory = [
      ...history,
      { role: "user", content: userMsg },
      { role: "assistant", content: replyText },
    ].slice(-12);
    sessions.set(sessionId, newHistory);

    // lead hint
    const lead =
      /book|call|pricing|quote|contact/i.test(userMsg)
        ? { ask_email: true }
        : { ask_email: false };

    res.json({ reply: replyText, lead });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ reply: "I hit a snag — mind trying again in a moment?" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
