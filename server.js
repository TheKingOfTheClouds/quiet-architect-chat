// server.js (BUTTONS-ONLY OPTIMIZED)
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();

/* -------------------- ENV -------------------- */
const BOOKING_URL = process.env.BOOKING_URL || "";               // Calendly/Cal link
const CONTACT_FORM_URL = process.env.CONTACT_FORM_URL || "";     // optional external form link
const ZAPIER_HOOK_URL = process.env.ZAPIER_HOOK_URL || "";       // Zapier catch hook
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || "";           // e.g. https://www.aquietarchitect.com/#portfolio

const DEBUG = process.env.DEBUG_LOGS === "true";

/* -------------------- CORS -------------------- */
const ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

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
app.use(express.json({
  type: ["application/json", "application/*+json", "text/plain"],
  limit: "1mb"
}));

// Rescue: if something came in as a raw string, parse once.
app.use((req, _res, next) => {
  if (typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); } catch { /* ignore */ }
  }
  next();
});

// Debug logs (no PII by default)
app.use((req, _res, next) => {
  if (DEBUG && req.method === "POST") {
    console.log("↘️ POST", req.url, "CT:", req.headers["content-type"]);
    try {
      // Avoid dumping PII fields in prod; DEBUG only
      console.log("   body:", JSON.stringify(req.body));
    } catch {
      console.log("   body: [unprintable]");
    }
  }
  next();
});

/* -------------------- Simple rate limiter -------------------- */
// Very lightweight, per IP, in-memory. Good enough for Render.
const RATE_WINDOW_MS = 60_000;  // 1 minute
const RATE_MAX = 60;            // 60 requests/min/IP
const rateBucket = new Map();   // ip -> { count, resetAt }

function rateLimit(req, res, next) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  const now = Date.now();
  const b = rateBucket.get(ip);

  if (!b || now > b.resetAt) {
    rateBucket.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  b.count += 1;
  if (b.count > RATE_MAX) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again shortly." });
  }
  return next();
}

/* -------------------- Optional: Load FAQs (kept for future) -------------------- */
// We keep this file loader in case you want to display FAQs via chips later.
// Not used for matching anymore (buttons-only).
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
} catch {
  console.warn("faqs.json missing/invalid — continuing with empty FAQ set.");
}

/* -------------------- Session memory w/ TTL cleanup -------------------- */
const sessions = new Map();   // sessionId -> [{role, content, ts}]
const profiles = new Map();   // sessionId -> { name?, ts }

const SESSION_TTL_MS = 1000 * 60 * 60; // 1 hour

function appendHistory(sessionId, role, content) {
  const arr = sessions.get(sessionId) || [];
  arr.push({ role, content, ts: Date.now() });
  sessions.set(sessionId, arr.slice(-12));
}

function setProfileName(sessionId, name) {
  const p = profiles.get(sessionId) || {};
  profiles.set(sessionId, { ...p, name, ts: Date.now() });
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
    setProfileName(sessionId, name);
    if (DEBUG) console.log("🟢 learned name", { sessionId, name });
  }
}

function firstName(sessionId) {
  return profiles.get(sessionId)?.name || null;
}

// Cleanup old sessions/profiles periodically (cheap)
let cleanupTick = 0;
function cleanupMaps() {
  cleanupTick++;
  if (cleanupTick % 25 !== 0) return; // every ~25 requests

  const now = Date.now();
  for (const [sid, arr] of sessions.entries()) {
    const last = arr[arr.length - 1]?.ts || 0;
    if (now - last > SESSION_TTL_MS) sessions.delete(sid);
  }
  for (const [sid, p] of profiles.entries()) {
    const last = p?.ts || 0;
    if (last && now - last > SESSION_TTL_MS) profiles.delete(sid);
  }
}

/* -------------------- Health -------------------- */
app.get("/", (_req, res) => res.send("A Quiet Architect API is running."));

/* -------------------- Config for widget -------------------- */
app.get("/config", (_req, res) => {
  res.json({
    booking: BOOKING_URL || null,
    contact: CONTACT_FORM_URL || null,
    portfolio: PORTFOLIO_URL || null
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
app.post("/lead", rateLimit, async (req, res) => {
  try {
    cleanupMaps();

    let {
      email = "",
      name = "",
      business = "",
      city = "",
      need = "",
      website = "",
      meta = {}
    } = req.body || {};

    // Normalize / scrub invisible chars
    const scrub = (s) => String(s || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/[<>]/g, "")
      .trim();

    email = scrub(email);
    name = scrub(name);
    business = scrub(business);
    city = scrub(city);
    need = scrub(need);
    website = scrub(website);

    // Remember name for this session if provided
    const sid = meta?.sessionId || "anon";
    if (name) setProfileName(sid, name);

    // Validate email (tolerant but safe)
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email);
    if (!emailOk) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

    if (DEBUG) {
      console.log("New lead:", {
        email: email.replace(/(^.).*(@.*$)/, "$1***$2"), // masked
        name,
        business,
        city,
        need,
        website,
        meta
      });
    } else {
      console.log("✅ Lead received");
    }

    if (ZAPIER_HOOK_URL) {
      const z = await fetch(ZAPIER_HOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          business,
          city,
          need,
          website,
          meta,
          source: "aqa-widget",
          created_at: new Date().toISOString()
        })
      });

      if (!z.ok) {
        const text = await z.text().catch(() => "");
        console.error("Zapier responded", z.status, z.statusText, text);
      } else if (DEBUG) {
        console.log("Zapier accepted lead");
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("lead error:", e);
    return res.status(500).json({ ok: false });
  }
});

/* -------------------- Chat (BUTTONS ONLY) -------------------- */
const chatStates = new Map(); // sessionId -> { nodeId, ts }

function setState(sessionId, nodeId) {
  chatStates.set(sessionId, { nodeId, ts: Date.now() });
}
function getState(sessionId) {
  return chatStates.get(sessionId)?.nodeId || "HOME";
}

function respond(res, { reply, chips = [], action = null, nodeId = null }) {
  const payload = { reply, chips, action };
  if (nodeId) payload.nodeId = nodeId;
  return res.json(payload);
}

// ---- Button Tree (the brain) ----
const FLOW = {
  HOME: {
    reply: "How can I help today?",
    chips: [
      { id: "LEARN", label: "Learn about A Quiet Architect" },
      { id: "QUOTE", label: "Get a quote / Schedule" },
    ],
  },

  LEARN: {
    reply: "Choose a topic:",
    chips: [
      { id: "WHAT_WE_BUILD", label: "What do you build?" },
      { id: "PRICING", label: "Pricing" },
      { id: "AUTOMATIONS", label: "What’s included in automations?" },
      { id: "TIMELINE", label: "Timeline" },
      { id: "PROCESS", label: "How the process works" },
      { id: "FULL_WEBSITES", label: "Do you build full websites too?" },
      { id: "SUPPORT", label: "Support & retainer" },
      { id: "PORTFOLIO", label: "See examples / portfolio" },
      { id: "HUMAN", label: "Talk to a human" },
      { id: "HOME", label: "Back" },
    ],
  },

  WHAT_WE_BUILD: {
    reply:
      "We build modern websites + automated systems that capture leads, follow up, and keep your business organized — without you managing the tech.",
    chips: [
      { id: "PRICING", label: "Pricing" },
      { id: "PROCESS", label: "How it works" },
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "LEARN", label: "Back" },
    ],
  },

  PRICING: {
    reply:
      "We offer Starter / Professional / Enterprise tiers. The right plan depends on whether you want a basic presence, serious automation, or a full system.",
    chips: [
      { id: "COMPARE_PLANS", label: "Compare plans" },
      { id: "SETUP_FEE", label: "What’s the setup fee for?" },
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "LEARN", label: "Back" },
    ],
  },

  COMPARE_PLANS: {
    reply:
      "Starter = simple site + a few automations. Professional = stronger lead + workflow system. Enterprise = advanced automation + AI chat + custom pipelines.",
    chips: [
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "PRICING", label: "Back" },
      { id: "LEARN", label: "Learn menu" },
    ],
  },

  SETUP_FEE: {
    reply:
      "The setup fee covers building your system the right way: pages, automation wiring, tracking, lead capture, and launch configuration — so it runs smoothly long-term.",
    chips: [
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "PRICING", label: "Back" },
      { id: "LEARN", label: "Learn menu" },
    ],
  },

  AUTOMATIONS: {
    reply:
      "Automations can include: lead capture → follow-up messages, booking workflows, forms to spreadsheets, notifications, and simple business pipelines.",
    chips: [
      { id: "PROCESS", label: "How it works" },
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "LEARN", label: "Back" },
    ],
  },

  TIMELINE: {
    reply:
      "Most launches take days to a couple weeks depending on content and how many automations we’re wiring. Want to scope it fast?",
    chips: [
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "PROCESS", label: "How it works" },
      { id: "LEARN", label: "Back" },
    ],
  },

  PROCESS: {
    reply:
      "Process: (1) quick scope (2) build + wire automations (3) review (4) launch + monitor. We keep it no-touch so you’re not babysitting tech.",
    chips: [
      { id: "PRICING", label: "Pricing" },
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "LEARN", label: "Back" },
    ],
  },

  FULL_WEBSITES: {
    reply:
      "Yes — we can build the full website. If you already have a site, we can also upgrade it and add automations without starting over.",
    chips: [
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "PROCESS", label: "How it works" },
      { id: "LEARN", label: "Back" },
    ],
  },

  SUPPORT: {
    reply:
      "Support is simple: we keep your system running, handle updates/optimizations, and maintain automations. Advanced features stay live with an active retainer.",
    chips: [
      { id: "PRICING", label: "Pricing" },
      { id: "QUOTE", label: "Get a quote / Schedule" },
      { id: "LEARN", label: "Back" },
    ],
  },

  PORTFOLIO: {
    reply: "Tap below to view examples:",
    chips: [
      { id: "OPEN_PORTFOLIO", label: "Open portfolio" },
      { id: "LEARN", label: "Back" },
    ],
  },

  HUMAN: {
    reply: "No problem. Want to schedule a call or request a quote?",
    chips: [
      { id: "SCHEDULE", label: "Schedule now" },
      { id: "QUOTE_FORM", label: "Request a quote (60 seconds)" },
      { id: "HOME", label: "Back" },
    ],
  },

  QUOTE: {
    reply: "Choose one:",
    chips: [
      { id: "SCHEDULE", label: "Schedule now" },
      { id: "QUOTE_FORM", label: "Request a quote (60 seconds)" },
      { id: "HOME", label: "Back" },
    ],
  },
};

function handleIntent(sessionId, intent) {
  // global allowed
  if (intent === "HOME") return "HOME";
  if (intent === "LEARN") return "LEARN";
  if (intent === "QUOTE") return "QUOTE";

  if (FLOW[intent]) return intent;
  return getState(sessionId);
}

app.post("/chat", rateLimit, async (req, res) => {
  try {
    cleanupMaps();

    const { message = "", intent = "", meta = {}, sessionId = "anon" } = req.body || {};

    if (DEBUG) console.log("Incoming:", { message, intent, path: meta?.path, referer: meta?.referer });

    // Learn name if they typed it (optional)
    const typed = String(message || "").trim();
    if (typed) maybeLearnName(sessionId, typed);

    // RULE 1: require intent. If they type, push them to buttons.
    const chosen = String(intent || "").trim();

    if (!chosen) {
      setState(sessionId, "HOME");
      if (typed) {
        return respond(res, {
          reply: "To keep this fast, please choose an option below:",
          chips: FLOW.HOME.chips,
          nodeId: "HOME",
        });
      }
      return respond(res, { ...FLOW.HOME, nodeId: "HOME" });
    }

    // Navigate
    const nextNode = handleIntent(sessionId, chosen);
    setState(sessionId, nextNode);

    // Special actions
    if (chosen === "SCHEDULE") {
      if (!BOOKING_URL) {
        return respond(res, {
          reply: "Scheduling isn’t set yet. Please request a quote and we’ll reach out.",
          chips: [
            { id: "QUOTE_FORM", label: "Request a quote (60 seconds)" },
            { id: "HOME", label: "Back" },
          ],
          nodeId: "QUOTE",
        });
      }
      return respond(res, {
        reply: "Perfect — tap below to schedule:",
        chips: [
          { id: "OPEN_BOOKING", label: "Open scheduling link" },
          { id: "QUOTE_FORM", label: "Request a quote instead" },
          { id: "HOME", label: "Back" },
        ],
        action: { type: "open_url", url: BOOKING_URL },
        nodeId: "QUOTE",
      });
    }

    if (chosen === "OPEN_BOOKING") {
      if (!BOOKING_URL) {
        return respond(res, { reply: "Scheduling link isn’t set yet.", chips: FLOW.HOME.chips, nodeId: "HOME" });
      }
      return respond(res, {
        reply: "Opening scheduling link…",
        chips: FLOW.HOME.chips,
        action: { type: "open_url", url: BOOKING_URL },
        nodeId: "HOME",
      });
    }

    if (chosen === "QUOTE_FORM") {
      // Prefer contact form URL if you have it; otherwise widget should POST /lead directly.
      if (CONTACT_FORM_URL) {
        return respond(res, {
          reply: "Quick quote form — tap below:",
          chips: [
            { id: "OPEN_CONTACT_FORM", label: "Open quote form" },
            { id: "HOME", label: "Back" },
          ],
          action: { type: "open_url", url: CONTACT_FORM_URL },
          nodeId: "QUOTE",
        });
      }

      return respond(res, {
        reply: "Quick quote: please submit your details.",
        chips: [{ id: "HOME", label: "Back" }],
        action: {
          type: "lead_form",
          submit: "/lead",
          fields: [
            { name: "name", label: "Name", required: true },
            { name: "email", label: "Email", required: true },
            { name: "business", label: "Business name", required: true },
            { name: "city", label: "City", required: true },
            {
              name: "need",
              label: "What do you need?",
              required: true,
              type: "select",
              options: ["Website", "Automations", "Website + automations", "AI chat widget", "Not sure (help me choose)"],
            },
            { name: "website", label: "Website URL (optional)", required: false },
          ],
        },
        nodeId: "QUOTE",
      });
    }

    if (chosen === "OPEN_CONTACT_FORM") {
      if (!CONTACT_FORM_URL) {
        return respond(res, { reply: "Form link isn’t set yet.", chips: FLOW.HOME.chips, nodeId: "HOME" });
      }
      return respond(res, {
        reply: "Opening quote form…",
        chips: FLOW.HOME.chips,
        action: { type: "open_url", url: CONTACT_FORM_URL },
        nodeId: "HOME",
      });
    }

    if (chosen === "OPEN_PORTFOLIO") {
      if (!PORTFOLIO_URL) {
        return respond(res, {
          reply: "Portfolio link isn’t set yet. Want to schedule instead?",
          chips: [
            { id: "SCHEDULE", label: "Schedule now" },
            { id: "HOME", label: "Back" },
          ],
          nodeId: "HOME",
        });
      }
      return respond(res, {
        reply: "Opening portfolio…",
        chips: FLOW.HOME.chips,
        action: { type: "open_url", url: PORTFOLIO_URL },
        nodeId: "HOME",
      });
    }

    // Normal node reply
    const node = FLOW[nextNode] || FLOW.HOME;

    // Keep minimal history (optional)
    appendHistory(sessionId, "user", chosen);
    appendHistory(sessionId, "assistant", node.reply);

    return respond(res, { ...node, nodeId: nextNode });

  } catch (err) {
    console.error("Error in /chat:", err);
    return res.json({
      reply: "I hit a snag, but we can keep it simple — choose an option below:",
      chips: FLOW.HOME.chips,
      nodeId: "HOME",
    });
  }
});

/* -------------------- Boot -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
