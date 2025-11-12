// server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const app = express();

/* -------------------- ENV -------------------- */
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";
const BOOKING_URL = process.env.BOOKING_URL || "";
const CONTACT_FORM_URL = process.env.CONTACT_FORM_URL || "";
const ZAPIER_HOOK_URL = process.env.ZAPIER_HOOK_URL || ""; // ✅ Zapier Catch Hook URL
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/* -------------------- CORS -------------------- */
const ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
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

/* -------------------- JSON parsing -------------------- */
app.use(express.json({
  type: ['application/json', 'application/*+json', 'text/plain'],
  limit: '1mb'
}));
app.use((req, _res, next) => {
  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch { /* ignore */ }
  }
  next();
});

/* -------------------- Debug log -------------------- */
app.use((req, _res, next) => {
  if (req.method === 'POST') {
    console.log('↘️ POST', req.url);
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
    FAQS = (raw || []).map(r => ({
      q: r.q ?? r.question ?? "",
      a: r.a ?? r.answer ?? ""
    })).filter(r => r.q && r.a);
  }
} catch (e) {
  console.warn("No faqs.json found or invalid JSON — continuing with empty FAQ set.");
}

/* -------------------- Memory helpers -------------------- */
const sessions = new Map();
const profiles = new Map();

function appendHistory(sessionId, role, content) {
  const arr = sessions.get(sessionId) || [];
  arr.push({ role, content, ts: Date.now() });
  sessions.set(sessionId, arr.slice(-12));
}
function maybeLearnName(sessionId, text) {
  const t = String(text || "").trim();
  let m =
    t.match(/\b(i\s*['’]?\s*m|i\s*am|my\s+name\s+is|this\s+is)\s+([A-Z][a-z'-]{1,30})\b/) ||
    t.match(/\b(call\s+me)\s+([A-Z][a-z'-]{1,30})\b/);
  if (!m) {
    const single = t.match(/^[A-Z][a-z'-]{1,30}$/);
    if (single) m = [, , single[0]];
  }
  if (m && m[2]) {
    const name = m[2].trim();
    const p = profiles.get(sessionId) || {};
    if (p.name !== name) profiles.set(sessionId, { ...p, name });
  }
}
function firstName(sessionId) {
  const p = profiles.get(sessionId);
  return p?.name || null;
}

/* -------------------- Health -------------------- */
app.get("/", (_req, res) => res.send("A Quiet Architect API is running."));
app.get("/config", (_req, res) => res.json({ booking: BOOKING_URL || null, contact: CONTACT_FORM_URL || null }));

/* -------------------- Lead Endpoint -------------------- */
app.get("/lead", (_req, res) => {
  res.send(`
    <h2>A Quiet Architect Lead Endpoint</h2>
    <p>This endpoint is for POST requests from the site widget or Zapier.</p>
    <p>If you’re seeing this, the API is live ✅</p>
  `);
});

/* -------------------- Lead Capture + Zapier -------------------- */
app.post("/lead", async (req, res) => {
  try {
    const b = req.body || {};
    const refererHeader = req.headers.referer || req.get('origin') || '';

    let { email = "", name = "", message = "", source = "aqa-widget", meta = {}, sessionId = "" } = b;

    // Clean and normalize
    email = String(email).normalize("NFKC").replace(/[<>]/g, "").trim();
    name = String(name).normalize("NFKC").trim();
    message = String(message || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

    console.log("✅ New Lead:", { email, name, message, meta });

    // Flatten metadata safely
    const MetaPath = meta?.path || (() => {
      try { return new URL(refererHeader).pathname || "/"; } catch { return "/"; }
    })();
    const MetaReferer = meta?.referer || refererHeader || "";
    const MetaQuery = meta?.query || "";
    const UTM = meta?.utm || {};
    const SessionID = sessionId || meta?.sessionId || "";

    // ✅ Final payload for Zapier
    const out = {
      Timestamp: new Date().toISOString(),
      Name: name,
      Email: email,
      Message: message,
      Source: source,
      "Meta Path": MetaPath,
      "Meta Referer": MetaReferer,
      "Meta Query": MetaQuery,
      "UTM Source": UTM.utm_source || "",
      "UTM Medium": UTM.utm_medium || "",
      "UTM Campaign": UTM.utm_campaign || "",
      "Session ID": SessionID,
    };

    if (ZAPIER_HOOK_URL) {
      const z = await fetch(ZAPIER_HOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(out),
      });
      if (!z.ok) console.error("⚠️ Zapier responded", z.status, z.statusText);
      else console.log("✅ Lead sent to Zapier");
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Lead error:", err);
    res.status(500).json({ ok: false });
  }
});

/* -------------------- Chat Endpoint -------------------- */
app.post("/chat", async (req, res) => {
  try {
    const { message = "", meta = {}, sessionId = "anon" } = req.body || {};
    const userMsg = String(message || "").trim();
    if (!userMsg) return res.json({ reply: "Say that again?" });

    maybeLearnName(sessionId, userMsg);
    const visitorName = firstName(sessionId);

    const history = sessions.get(sessionId) || [];
    const lastAssistant = [...history].reverse().find(m => m.role === "assistant")?.content || "";
    const offeredBooking = /schedule a call|book a (quick )?call|book a meeting/i.test(lastAssistant);
    const userAffirmed = /\b(yes|yep|yeah|sure|ok|okay|sounds good|let'?s do it|lets do it)\b/i.test(userMsg);

    if (BOOKING_URL && offeredBooking && userAffirmed) {
      const linkText = `[schedule a call](${BOOKING_URL})`;
      const replyText = `Perfect — let’s lock a time. You can ${linkText}.`;
      appendHistory(sessionId, "user", userMsg);
      appendHistory(sessionId, "assistant", replyText);
      return res.json({ reply: replyText, lead: { ask_email: true } });
    }

    console.log("Incoming chat:", { text: userMsg, path: meta?.path, referer: meta?.referer });

    // FAQ match
    const matches = FAQS.map(f => ({ f, s: (f.q + f.a).toLowerCase().includes(userMsg.toLowerCase()) ? 1 : 0 }))
      .filter(x => x.s > 0).slice(0, 4);
    const faqContext = matches.map((m, i) => `FAQ #${i + 1}\nQ: ${m.f.q}\nA: ${m.f.a}`).join("\n\n");

    const systemPrompt = `
You are "Architect," a friendly teammate for A Quiet Architect.
Be warm, calm, and concise. Avoid corporate filler.
${visitorName ? `Visitor name: ${visitorName}` : ""}
Booking link: ${BOOKING_URL || "(none)"}
Relevant FAQs:
${faqContext || "(none)"}
`.trim();

    let replyText = visitorName
      ? `${visitorName}, happy to help.`
      : "Happy to help — want me to book a quick intro call?";

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
        console.error("OpenAI error:", e.message);
      }
    }

    appendHistory(sessionId, "user", userMsg);
    appendHistory(sessionId, "assistant", replyText);

    const lead = /book|call|pricing|quote|contact|email|schedule/i.test(userMsg)
      ? { ask_email: true }
      : { ask_email: false };

    res.json({ reply: replyText, lead });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.json({ reply: "I hit a snag — mind saying that again?" });
  }
});

/* -------------------- Boot -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
