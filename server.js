// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

// CORS: allow your site (or any) to call the API
app.use(
  cors({
    origin: true, // reflect request origin
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);
app.options("*", cors()); // preflight

app.use(bodyParser.json());

// health
app.get("/", (req, res) => {
  res.send("A Quiet Architect API is running...");
});

// main chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message = "", meta = {} } = req.body || {};
    console.log("Incoming message:", message, meta);

    // basic echo (we can swap in GPT next)
    const reply = `You said: ${String(message).slice(0, 200)}. Want me to book a quick intro call?`;
    const lead =
      /book|call|pricing|quote|contact/i.test(message)
        ? { ask_email: true }
        : { ask_email: false };

    res.json({ reply, lead });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
