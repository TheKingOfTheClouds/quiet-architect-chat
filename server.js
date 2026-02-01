// server.js (Simple Mode: no OpenAI)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Optional later
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || "https://www.aquietarchitect.com/work";
const BOOKING_URL = process.env.BOOKING_URL || "https://www.aquietarchitect.com/contact";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const ratelimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------- PRELOADED FLOW ----------
const FLOW = {
  HOME: {
    reply: "How can I help today?",
    chips: [
      { id: "LEARN", label: "What is A Quiet Architect?" },
      { id: "SERVICES", label: "What do you build?" },
      { id: "PRICING", label: "Pricing" },
      { id: "PORTFOLIO", label: "See portfolio" },
      { id: "QUOTE", label: "Get a quote" },
      { id: "CONTACT", label: "Contact / Book" },
    ],
  },

  LEARN: {
    reply:
      "A Quiet Architect builds simple, high-converting websites and automations for local businesses — designed to capture leads and reduce busywork.",
    chipsBackHome: true,
  },

  SERVICES: {
    reply:
      "We build Framer websites, contact/quote funnels, lead capture, booking flows, and lightweight automations (when you're ready). Tell me what type of business you have.",
    chipsBackHome: true,
  },

  PRICING: {
    reply:
      "Pricing depends on what you need (site only vs site + automation). If you want, tap “Get a quote” and we’ll follow up with the best option.",
    chipsBackHome: true,
  },

  PORTFOLIO: {
    reply: "Opening our portfolio.",
    action: { type: "open_url", url: PORTFOLIO_URL },
    chipsBackHome: true,
  },

  QUOTE: {
    reply: "Perfect. Fill this out and we’ll follow up fast.",
    action: {
      type: "lead_form",
      reason: "Share your details so we can quote accurately.",
      fields: [
        { id: "name", label: "Name", required: true },
        { id: "email", label: "Email", required: true },
        { id: "phone", label: "Phone (optional)", required: false },
        { id: "message", label: "What do you need?", required: true, multiline: true },
      ],
    },
    chipsBackHome: true,
  },

  CONTACT: {
    reply: "Opening contact / booking.",
    action: { type: "open_url", url: BOOKING_URL },
    chipsBackHome: true,
  },
};

function homePayload(overrideReply) {
  return {
    reply: overrideReply || FLOW.HOME.reply,
    chips: FLOW.HOME.chips,
    nodeId: "HOME",
  };
}

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/config", (req, res) => {
  // supports URL params if you want per-client
  const businessName = String(req.query.businessName || "A Quiet Architect");
  const city = String(req.query.city || "Freeport, IL");
  const captureLeads = String(req.query.captureLeads || "true") !== "false";

  res.json({
    businessName,
    city,
    captureLeads,
    chips: FLOW.HOME.chips,
  });
});

// Keep lead endpoint simple for now (Zapier later)
app.post("/lead", ratelimit, async (req, res) => {
  // Later: POST to Zapier webhook
  console.log("[LEAD]", { ...req.body, created_at: new Date().toISOString() });
  res.json({ ok: true });
});

// Chat = intents only. Typing triggers lead form (simple rule).
app.post("/chat", ratelimit, async (req, res) => {
  const { intent = "", message = "" } = req.body || {};
  const chosen = String(intent).trim();
  const typed = String(message).trim();

  // First load
  if (!chosen && !typed) return res.json(homePayload());

  // If user typed anything, force lead capture (no AI)
  if (typed && !chosen) {
    return res.json({
      ...homePayload(
        "For the fastest help, choose a button — or leave your info and we’ll follow up."
      ),
      action: FLOW.QUOTE.action,
    });
  }

  const node = FLOW[chosen];
  if (!node) return res.json(homePayload());

  const payload = {
    reply: node.reply,
    nodeId: chosen,
    chips: node.chipsBackHome ? FLOW.HOME.chips : [],
    ...(node.action ? { action: node.action } : {}),
  };

  return res.json(payload);
});

app.listen(PORT, () => console.log(`Server running on :${PORT}`));
