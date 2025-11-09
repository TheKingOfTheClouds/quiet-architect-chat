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

// -------- Friendly profile memory (per session) --------
const profiles = new Map(); // sessionId -> { name?: string }

// Learn a first name from common phrasings OR a single capitalized word
function maybeLearnName(sessionId, text) {
  const t = String(text || "").trim();

  // Patterns like: "I'm Dom", "I am Dominique", "my name is Jay", "this is Ana"
  let m =
    t.match(/\b(i\s*['’]?\s*m|i\s*am|my\s+name\s+is|this\s+is)\s+([A-Z][a-z'-]{1,30})\b/) ||
    t.match(/\b(call\s+me)\s+([A-Z][a-z'-]{1,30})\b/);

  // Fallback: a single capitalized token that *looks* like a name
  if (!m) {
    const single = t.match(/^[A-Z][a-z'-]{1,30}$/);
    if (single) m = [, , single[0]]; // shape it like the 2-capture match above
  }

  if (m && m[2]) {
    const name = m[2].trim();
    const p = profiles.get(sessionId) || {};
    if (p.name !== name) {
      profiles.set(sessionId, { ...p, name });
      console.log("🟢 learned name", { sessionId, name });
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
      // ✅ Optional: remember name for this session if provided
if (name) {
  const sid = meta?.sessionId || "anon";
  const p = profiles.get(sid) || {};
  profiles.set(sid, { ...p, name });
  console.log("✅ Saved name to profile memory:", sid, profiles.get(sid));

}


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

    // Learn/recall first name from this message
    maybeLearnName(sessionId, userMsg);
    const visitorName = firstName(sessionId);

    // Simple server-side analytics
    console.log("Incoming:", { text: userMsg, path: meta?.path, referer: meta?.referer });

    // Pick relevant FAQs
    const matches = topFaqs(userMsg, 4);
    const faqContext = matches
      .map((f, i) => `FAQ #${i + 1}\nQ: ${f.q}\nA: ${f.a}`)
      .join("\n\n");

    // If they ask about their name, answer directly (now that visitorName exists)
    if (/\b(what'?s|what is|do you remember)\s+my\s+name\b/i.test(userMsg)) {
      return res.json({
        reply: visitorName
          ? `You told me your name is ${visitorName}.`
          : `I don't have it yet — want to share your name?`
      });
    }

    // Brand voice / prompt
    const systemPrompt = `
You are "Architect," a friendly teammate for A Quiet Architect.
Be warm, casual, and confident; avoid corporate fluff and over-exclamation.
Use short human sentences. If unclear, ask one crisp question.
If a call would help, you can offer it gently.

Known:
- Booking link: ${BOOKING_URL || "(not set)"}.
- Ask for name + email together only if needed.
${visitorName ? `Visitor’s first name: ${visitorName}` : ""}

Relevant FAQs (may be empty):
${faqContext || "(no strong FAQ matches)"}
`.trim();

    // Default reply fallback (in case OpenAI is unavailable)
    let replyText =
      (visitorName ? `${visitorName}, ` : "") +
      `happy to help. Want me to book a quick intro call so we can scope what you need${
        BOOKING_URL ? ` (you can [schedule a call](${BOOKING_URL}))` : ""
      }?`;

    // Call OpenAI if configured — DO NOT crash on errors
    if (openai) {
      try {
        const out = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
          ],
        });
        replyText = out.choices?.[0]?.message?.content?.trim() || replyText;
      } catch (e) {
        console.error("OpenAI error:", e?.status || "", e?.message || e);
        // keep fallback reply
      }
    }

    // --- Booking link cleanup + smart insertion ---
    if (BOOKING_URL) {
      const linkText = `[schedule a call](${BOOKING_URL})`;
      const hostEsc = (() => {
        try { return new URL(BOOKING_URL).hostname.replace(/\./g, "\\."); }
        catch { return "cal\\.com"; }
      })();

      // Remove any existing booking link variants (markdown, parens, raw)
      const bookingMarkdown = new RegExp(`\\[[^\\]]*\\]\\((https?:\\/\\/(?:www\\.)?${hostEsc}[^)]*)\\)`, "gi");
      const parenUrl        = new RegExp(`\\((https?:\\/\\/(?:www\\.)?${hostEsc}[^)]*)\\)`, "gi");
      const rawUrl          = new RegExp(`https?:\\/\\/(?:www\\.)?${hostEsc}[^\\s\\]]*`, "gi");

      replyText = (replyText || "")
        .replace(bookingMarkdown, "")
        .replace(parenUrl, "")
        .replace(rawUrl, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Detect if user intent = booking or call
      const lower        = (userMsg || "").toLowerCase();
      const wantsBooking =
        /(book|schedule|meeting|call|chat|talk)/i.test(lower) ||
        /(book|schedule).*(call|meeting)/i.test(replyText);

      if (wantsBooking) {
        const phrase = /(schedule a call|book a (quick )?call|book a meeting)/i;

        if (phrase.test(replyText)) {
          // Inline replacement for the phrase with a clickable link
          replyText = replyText.replace(phrase, linkText);
        } else if (!/\[[^\]]+\]\(https?:\/\/.*\)/.test(replyText)) {
          // Otherwise append one neat link if none exists yet
          replyText = replyText.replace(/[.:!?]+$/, "");
          replyText += `. You can ${linkText} 😊`;
        }
      }
    }

    // Update memory (keep it lean)
    appendHistory(sessionId, "user", userMsg);
    appendHistory(sessionId, "assistant", replyText);

    // Nudge email capture only when it makes sense
    const lead =
      /book|call|pricing|price|quote|contact|email|schedule|meeting/i.test(userMsg)
        ? { ask_email: true }
        : { ask_email: false };

    res.json({ reply: replyText, lead });
  } catch (err) {
    console.error("Error in /chat:", err);
    // Still reply (avoid dropping to the widget “snag” UX)
    res.json({ reply: "I hit a snag on my side, but I'm here. Want to try that again or book a quick call?" });
  }
});





/* -------------------- Boot -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
