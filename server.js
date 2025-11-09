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

// Friendly profile memory (per session)
const profiles = new Map(); // sessionId -> { name?: string }

// Tiny name extractor: "I'm Dom", "I am Dominique", "My name is Jay"
function maybeLearnName(sessionId, text) {
  const t = String(text || "");
  const m =
    t.match(/\b(?:i\s*['’]?\s*m|i\s*am|my\s+name\s+is)\s+([A-Z][a-z'-]{1,30})\b/) ||
    t.match(/\b(?:this\s+is)\s+([A-Z][a-z'-]{1,30})\b/);
  if (m && m[1]) {
    const name = m[1].trim();
    const p = profiles.get(sessionId) || {};
    if (!p.name) {
      profiles.set(sessionId, { ...p, name });
    }
  }
}

function firstName(sessionId) {
  const p = profiles.get(sessionId);
  return p?.name || null;
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

/* -------------------- Friendly GET for /lead -------------------- */
app.get("/lead", (_req, res) => {
  res.send(`
    <h2>A Quiet Architect Lead Endpoint</h2>
    <p>This endpoint is for POST requests from the site widget or Zapier.</p>
    <p>If you’re seeing this, the API is live and reachable ✅</p>
  `);
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

/* -------------------- Chat (friendly, personal) -------------------- */
app.post("/chat", async (req, res) => {
  try {
    const { message = "", meta = {}, sessionId = "anon" } = req.body || {};
    const userMsg = String(message || "").trim();
    if (!userMsg) return res.json({ reply: "Say that again?" });

    // --- Small talk / quick replies (before FAQs/LLM) ---
const smallTalk = [
  [/^hi$|^hey$|^hello$/i, "Hey! 👋 What are you building?"],
  [/how are you/i, "Doing great — shipping quietly. What can I help with?"],
  [/thank(s| you)/i, "Anytime! Want me to book a quick intro call?"],
  [/bye|goodbye|see ya/i, "Catch you later! If you want, I can book a quick intro call."]
];

for (const [re, text] of smallTalk) {
  if (re.test(userMsg)) {
    return res.json({ reply: text, lead: { ask_email: false } });
  }
}


    // learn name if they tell us
    maybeLearnName(sessionId, userMsg);
    const visitorName = firstName(sessionId);

    // light analytics
    console.log("Incoming:", { text: userMsg, path: meta?.path, referer: meta?.referer, visitorName });

    // pick relevant FAQs
    const matches = topFaqs(userMsg, 4);
    const faqContext = matches
      .map((f, i) => `FAQ #${i + 1}\nQ: ${f.q}\nA: ${f.a}`)
      .join("\n\n");

    // conversation history (short)
    const history = (sessions.get(sessionId) || []).map(h => ({
      role: h.role, content: h.content
    }));

    // Voice & behavior
    const systemPrompt = `
You are "Architect" — a friendly teammate and conversational guide for *A Quiet Architect*.

Your role:
- Help visitors clearly, calmly, and confidently — like a human who enjoys good conversations.
- Speak naturally. Use contractions, warmth, and personality, but never overdo it.
- You’re not a sales rep; you’re a calm, reliable teammate helping them find clarity.

Tone:
- Warm, curious, and easygoing — the kind of person who listens well.
- Short, clear sentences. Natural rhythm. Use emojis lightly when they help tone (🙂, 👋, 💡).
- Never sound robotic or formal. No filler like “as an AI” or “as an assistant.”

Conversation flow:
1. Acknowledge what they said in a natural way (e.g., “Good question,” “That’s a smart one,” “Yeah, totally get that.”)
2. Give a simple, grounded answer or insight.
3. Offer one thoughtful next step — not pushy, just helpful.
4. If they seem curious about services or details, suggest a quick intro call and include the booking link once:
   (${BOOKING_URL || "(booking link not set)"}).

Context:
We design brands, websites, and automation systems that run quietly in the background — smooth, minimal, and effective.
Our audience: small business owners, creatives, and professionals who want clarity, consistency, and calm systems.

Guidelines:
- Keep replies under 100–120 words unless they ask for more detail.
- If something’s unclear, ask one precise, friendly question.
- If the topic is outside scope, just say so naturally and pivot to booking a call.
- Never oversell — just be real and helpful.
- If you know the visitor’s name, use it naturally once in a while (never overuse).

${visitorName ? `Visitor’s first name: ${visitorName}` : ""}

Relevant FAQs (may be empty):
${faqContext || "(no strong FAQ matches)"}
`.trim();


    // default reply fallback
    let replyText =
      (visitorName ? `${visitorName}, ` : "") +
      `happy to help. Want me to book a quick intro call so we can scope what you need${BOOKING_URL ? ` (${BOOKING_URL})` : ""}?`;

    if (openai) {
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMsg },
      ];

      const out = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7, // slightly warmer
        messages
      });

      replyText = out.choices?.[0]?.message?.content?.trim() || replyText;
    }
// --- Normalize to exactly ONE booking link ---
if (BOOKING_URL) {
  const linkText = `[schedule a call](${BOOKING_URL})`;
  const host = (() => {
    try {
      return new URL(BOOKING_URL).hostname.replace(/\./g, "\\.");
    } catch {
      return "call\\.com";
    }
  })();

  // 1) Remove any existing booking link variants (bracketed, raw, or extra parens)
  const bookingMarkdownLink = new RegExp(`\\[[^\\]]*\\]\\((https?:\\/\\/(?:www\\.)?${host}[^)]*)\\)`, "gi");
  const bracketedRaw = new RegExp(`\\((https?:\\/\\/(?:www\\.)?${host}[^)]*)\\)`, "gi");
  const rawUrl = new RegExp(`https?:\\/\\/(?:www\\.)?${host}[^\\s\\]]*`, "gi");

  replyText = replyText
    .replace(bookingMarkdownLink, "")
    .replace(bracketedRaw, "")
    .replace(rawUrl, "")
    .replace(/\s{2,}/g, " ") // collapse extra spaces
    .replace(/(.\s*[\.,!?:;]){2,}/g, "."); // minor punctuation tidy

  // 2) If user intent suggests booking, add link naturally
  const lower = userMsg.toLowerCase();
  const wantsBooking =
    /(book|schedule|meeting|call|chat|talk)/i.test(lower) ||
    /(book|schedule).*(call|meeting)/i.test(replyText);

  if (wantsBooking) {
    const phrase = /(schedule a call|book a (quick )?call|book a meeting)/i;

    if (phrase.test(replyText)) {
      // Inline replace
      replyText = replyText.replace(phrase, linkText);
    } else if (!/\[.*\]\(https?:\/\/.*\)/.test(replyText)) {
      // Append a clean clickable link once
      replyText = replyText.trim().replace(/[.:!?]+$/, "");
      replyText += `. You can ${linkText} 😊`;
    }
  }
}

// --- Update memory (keep it lean) ---
appendHistory(sessionId, "user", userMsg);
appendHistory(sessionId, "assistant", replyText);

    // nudge email capture only when it makes sense
    const lead =
      /book|call|pricing|price|quote|contact|email|schedule|meeting/i.test(userMsg)
        ? { ask_email: true }
        : { ask_email: false };

    res.json({ reply: replyText, lead });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ reply: "Hmm — I hit a snag. Mind trying again in a moment?" });
  }
});


/* -------------------- Boot -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
