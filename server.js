// server.js (BUTTONS-ONLY OPTIMIZED — FIXED)
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();

/* ✅ STATIC FILES (for widget.js) */
app.use(express.static("public"));

/* -------------------- ENV -------------------- */
const BOOKING_URL = process.env.BOOKING_URL || "";
const CONTACT_FORM_URL = process.env.CONTACT_FORM_URL || "";
const ZAPIER_HOOK_URL = process.env.ZAPIER_HOOK_URL || "";
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || "";
const DEBUG = process.env.DEBUG_LOGS === "true";

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
  type: ["application/json", "application/*+json", "text/plain"],
  limit: "1mb"
}));

app.use((req, _res, next) => {
  if (typeof req.body === "string") {
    try { req.body = JSON.parse(req.body); } catch {}
  }
  next();
});

/* -------------------- Rate Limit -------------------- */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;
const rateBucket = new Map();

function rateLimit(req, res, next) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0];
  const now = Date.now();
  const b = rateBucket.get(ip);

  if (!b || now > b.resetAt) {
    rateBucket.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }
  b.count++;
  if (b.count > RATE_MAX) {
    return res.status(429).json({ ok: false });
  }
  next();
}

/* -------------------- Health -------------------- */
app.get("/", (_req, res) => res.send("A Quiet Architect API is running."));

/* -------------------- Config -------------------- */
app.get("/config", (_req, res) => {
  res.json({
    booking: BOOKING_URL || null,
    contact: CONTACT_FORM_URL || null,
    portfolio: PORTFOLIO_URL || null
  });
});

/* -------------------- Lead -------------------- */
app.post("/lead", rateLimit, async (req, res) => {
  return res.json({ ok: true });
});

/* -------------------- Chat -------------------- */
const FLOW = {
  HOME: {
    reply: "How can I help today?",
    chips: [
      { id: "LEARN", label: "Learn about A Quiet Architect" },
      { id: "QUOTE", label: "Get a quote / Schedule" },
    ],
  },
};

function respond(res, payload) {
  return res.json(payload);
}

app.post("/chat", rateLimit, async (req, res) => {
  try {
    const { intent = "", sessionId = "anon" } = req.body || {};
    const chosen = String(intent || "").trim();

    if (!chosen) {
      return respond(res, { ...FLOW.HOME, nodeId: "HOME" });
    }

    if (chosen === "OPEN_PORTFOLIO") {
      if (!PORTFOLIO_URL) {
        return respond(res, { reply: "Portfolio not set.", chips: FLOW.HOME.chips });
      }
      return respond(res, {
        reply: "Opening portfolio…",
        action: { type: "open_url", url: PORTFOLIO_URL },
        chips: FLOW.HOME.chips,
      });
    } // ✅ FIXED: missing brace was HERE

    return respond(res, { ...FLOW.HOME, nodeId: "HOME" });

  } catch (err) {
    console.error("Chat error:", err);
    return respond(res, FLOW.HOME);
  }
});

/* -------------------- Boot -------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
