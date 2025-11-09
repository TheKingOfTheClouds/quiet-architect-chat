// server.js
import express from "express";
import cors from "cors";
// import bodyParser from "body-parser"; // ❌ not needed with express.json()
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const app = express();

/* -------------------- ENV -------------------- */
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || ""; // e.g., https://yourdomain.com (optional)
const BOOKING_URL = process.env.BOOKING_URL || "";          // e.g., Cal.com / Calendly link
const CONTACT_FORM_URL = process.env.CONTACT_FORM_URL || "";// e.g., Framer/Typeform form
const ZAPIER_HOOK_URL = process.env.ZAPIER_HOOK_URL || "";  // optional Zapier catch hook
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/* -------------------- CORS -------------------- */
const ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean); // e.g. "https://www.aquietarchitect.com, https://aquietarchitect.com"

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server, curl, Postman
    try {
      const host = new URL(origin).hostname;
      const allowed = /\.onrender\.com$/.test(host) || ORIGINS.includes(origin);
      return cb(null, allowed);
    } catch {
      return cb(null, false);
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.options("*", cors());

/* -------------------- JSON parsing (robust) -------------------- */
// Prefer Express's built-in parser and accept common content types.
app.use(express.json({
  type: ['application/json', 'application/*+json', 'text/plain'],
  limit: '1mb'
}));

// Rescue: if something came in as a raw string, parse once.
app.use((req, _res, next) => {
  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch { /* ignore */ }
  }
  next();
});

// Light debug for POSTs (remove later if you want)
app.use((req, _res, next) => {
  if (req.method === 'POST') {
    console.log('↘️  POST', req.url, 'CT:', req.headers['content-type']);
    try { console.log('   body:', JSON.stringify(req.body)); } catch { console.log('   body: [unprintable]'); }
  }
  next();
});

/* -------------------- OpenAI -------------------- */
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/* -------------------- Load FAQs -------------------- */
const FAQ_PATH = path.join(process.cwd(), "faqs.json");
let FAQS = [];
try {
  if (fs.existsSync(FAQ_PATH)) {
    const raw = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));
    // Support either [{q, a}] or [{question, answer}]
    FAQS = (raw || []).map(r => ({
      q: r.q ?? r.question ?? "",
      a: r.a ?? r.answer ?? ""
    })).filter(r => r.q && r.a);
  }
} catch (e) {
  console.warn("No faqs.json found or invalid JSON — continuing with empty FAQ set.");
}

/* --------- Tiny FAQ scorer: fast, good-enough --------- */
function scoreFaq(query, faq) {
  const q = String(query || "").toLowerCase();
  const text = (faq.q + " " + faq.a).toLowerCase();
  const terms = q.split(/[^a-z0-9]+/).filter(Boolean);
  return terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
}
function topFaqs(query, k = 4) {
  if (!FAQS.length) return [];
  return [...FAQS]
    .map((f) => ({ f, s: scoreFaq(query, f) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .filter((x) => x.s > 0)
    .map((x) => x.f);
}

/* -------------------- Memory per session -------------------- */
const sessions = new Map(); // sessionId -> [{role, content, ts}]
function appendHistory(sessionId, role, content) {
  const arr = sessions.get(sessionId) || [];
  arr.push({ role, content, ts: Date.now() });
  sessions.set(sessionId, arr.slice(-12)); // cap last ~12 messages
}

/* -------------------- Health -------------------- */
app.get("/", (_req, res) => {
  res.send("A Quiet Architect API is running.");
});

/* -------------------- Config for widget -------------------- */
app.get("/config", (_req, res) => {
  res.json({
    booking: BOOKING_URL || null,
    contact: CONTACT_FORM_URL || null
  });
});

/* -------------------- Lead capture (+ optional Zapier) -------------------- */
app.post("/lead", async (req, res) => {
  try {
    let { email = "", name = "", meta = {} } = req.body || {};

    // Normalize & scrub common invisible/hard-to-see chars
    email = String(email)
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")  // zero width
      .replace(/\u00A0/g, " ")               // non-breaking space
      .replace(/[<>]/g, "")                  // angle brackets
      .trim();

    name  = String(name || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();

    // Helpful logging to catch weird characters
    console.log("Lead email (raw chars):", Array.from(email).map(c => c.charCodeAt(0)));

    // Slightly more tolerant email check (still safe)
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email);
    if (!emailOk) {
      return res.status(400).json({ ok: false, error: "Invalid email", debug: req.body || null });
    }

    console.log("New lead:", { email, name, meta });

    if (ZAPIER_HOOK_URL) {
      const z = await fetch(ZAPIER_HOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, meta, source: "aqa-widget" })
      });
      if (!z.ok) {
        const text = await z.text().catch(() => "");
        console.error("Zapier responded", z.status, z.statusText, text);
      } else {
        console.log("Zapier accepted lead");
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("lead error:", e);
    res.status(500).json({ ok: false });
  }
});

/* -------------------- Chat -------------------- */
app.post("/chat", async (req, res) => {
  try {
    const { message = "", meta = {}, sessionId = "anon" } = req.body || {};
    const userMsg = String(message || "").trim();
    if (!userMsg) return res.json({ reply: "Say that again?" });

    // simple server-side analytics
    console.log("Incoming:", { text: userMsg, path: meta?.path, referer: meta?.referer });

    // pick relevant FAQs
    const matches = topFaqs(userMsg, 4);
    const faqContext = matches
      .map((f, i) => `FAQ #${i + 1}\nQ: ${f.q}\nA: ${f.a}`)
      .join("\n\n");

    // conversation history
    const history = (sessions.get(sessionId) || []).map(h => ({
      role: h.role, content: h.content
    }));

    // brand voice
    const systemPrompt = `
You are "Architect" — the voice of A Quiet Architect.

Purpose:
- Guide people with calm precision. Simplify chaos. Design systems that flow.

Personality:
- Confident, minimal, human. No fluff. Helpful and direct.

Style:
- Short sentences. Elegant phrasing.
- One thought → line break → next insight.
- Offer an intro call naturally when appropriate.

Brand context:
We design brands, websites, and automation systems that run quietly and smoothly in the background.
Audience: small businesses, creatives, professionals who want cohesion and calm.

Relevant FAQs (may be empty):
${faqContext || "(no strong FAQ matches)"}

Rules:
- If uncertain, say so and suggest a quick intro call.
- Prefer <120 words unless detail is requested.
- Never spam links; only share if asked or clearly useful.
`.trim();

    // default reply fallback
    let replyText = `You said: ${userMsg}. Want me to book a quick intro call?`;

    if (openai) {
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMsg },
      ];

      const out = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages
      });

      replyText = out.choices?.[0]?.message?.content?.trim() || replyText;
    }

    // update session memory
    appendHistory(sessionId, "user", userMsg);
    appendHistory(sessionId, "assistant", replyText);

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

/* -------------------- Boot -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
