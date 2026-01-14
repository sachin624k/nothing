import fs from "fs";
import cors from "cors";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { extractAudio } from "./services/extractAudio.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET","POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());
const upload = multer({ dest: "uploads/" });

// ping test
app.get("/ping", (req, res) => res.send("pong"));

// STEP 0: video upload + audio
app.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No video uploaded" });
  const audioPath = await extractAudio(req.file.path);
  return res.json({ ok: true, video: req.file.path, audio: audioPath });
});

// STEP 1: STT whisper
app.post("/stt/cloud", async (req, res) => {
  const { audioPath } = req.body;
  if (!audioPath || !fs.existsSync(audioPath))
    return res.status(400).json({ error: "Invalid audio path" });

  const out = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-large-v3-turbo"
  });

  const text = out.text || "";
  return res.json({ ok: true, text });
});

// STEP 2: claim extraction
app.post("/claims/extract", async (req, res) => {
  const text = (req.body.text || "").trim();
  if (text.length < 3) return res.status(400).json({ error: "Invalid text" });

  const out = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `Extract claims from "${text}". Output JSON ONLY like:
{"claims":[]}
`
      }
    ],
    response_format: { type: "json_object" }
  });

  const claims = JSON.parse(out.choices[0].message.content).claims || [];
  return res.json({ ok: true, claims });
});

// STEP 3: claim verify
app.post("/claims/verify", async (req, res) => {
  const { claim } = req.body;
  if (!claim) return res.status(400).json({ error: "No claim provided" });

  const out = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: [
      { role: "system", content: "ONLY JSON no markup" },
      { role: "user", content: `Verify: "${claim}"` }
    ],
    response_format: { type: "json_object" }
  });

  const v = JSON.parse(out.choices[0].message.content);

  return res.json({
    ok: true,
    verdict: {
      claim,
      category: v.category || "Unknown",
      fake_score: Number(v.fake_score) || 0.5,
      confidence: Number(v.confidence) || 0.5,
      reasoning: v.reasoning || "no reasoning"
    }
  });
});

// FINAL PIPELINE: video → text → claims → verify
// FINAL PIPELINE: video → text → claims → verify
app.post("/video/verify", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video uploaded" });

    const audioPath = await extractAudio(req.file.path);

    const stt = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3-turbo"
    });

    const text = stt.text || "";

    if (!text.trim()) {
      return res.json({ ok: true, text, claims: [], results: [], note: "No speech detected" });
    }

    // extract claims
    const claimsOut = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      messages: [{
        role: "user",
        content: `Extract factual claims from: "${text}".
Return valid JSON only like:
{"claims":["claim1","claim2"]}`
      }],
      response_format: { type: "json_object" }
    });

    let claims = JSON.parse(claimsOut.choices[0].message.content).claims || [];

    // force normalize
    claims = claims.map(c => (typeof c === "string" ? c : c.claim));

    const results = [];

    for (const claim of claims) {
      const verifyOut = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0,
        messages: [
          { role: "system", content: "Output JSON only. json. no markdown." },
          { role: "user", content: `Verify misinformation claim in india: "${claim}".
Return clean json like:
{
  "category": "...",
  "fake_score": 0-1,
  "confidence": 0-1,
  "reasoning": "..."
}` }
        ],
        response_format: { type: "json_object" }
      });

      const v = JSON.parse(verifyOut.choices[0].message.content);

      results.push({
        claim,
        category: v.category || "Unknown",
        fake_score: Number(v.fake_score) || 0.5,
        confidence: Number(v.confidence) || 0.5,
        reasoning: v.reasoning || ""
      });
    }

    return res.json({ ok: true, text, claims, results });

  } catch (err) {
    console.error("VIDEO VERIFY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(5001, () => console.log("Backend listening on 5001"));
