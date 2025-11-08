import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("A Quiet Architect API is running...");
});

app.post("/chat", async (req, res) => {
  const { message, meta } = req.body || {};
  console.log("Message received:", message, meta);
  
  const reply = `Got it — “${String(message).slice(0,120)}.” Want me to book a quick intro call?`;
  const lead = /book|call|pricing|quote|contact/i.test(message) ? { ask_email: true } : { ask_email: false };

  res.json({ reply, lead });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
