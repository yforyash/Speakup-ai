import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST'] }));
app.use(express.json());

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const defaultData = { reports: [] };
const db = new Low(adapter, defaultData);

await db.read();
db.data ||= defaultData;
await db.write();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/report', async (req, res) => {
  const { title, description, evidenceUrl } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  let summary = '';
  let severity = 'Medium';

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a safety analysis assistant. You will receive a report description. Summarize it in 1 sentence and assign a severity level: Low, Medium, or High based on urgency, violence, or potential danger.",
        },
        {
          role: "user",
          content: `Description: ${description}`,
        },
      ],
    });

    const result = aiResponse.choices[0].message.content;
    const [summaryLine, severityLine] = result.split("\n");
    summary = summaryLine?.replace("Summary:", "").trim();
    severity = severityLine?.replace("Severity:", "").trim();
  } catch (err) {
    console.error("AI summarization failed:", err.message);
    summary = "Unable to summarize";
    severity = "Unknown";
  }

  const newReport = {
    id: nanoid(),
    title,
    description,
    evidenceUrl: evidenceUrl || null,
    summary,
    severity,
    timestamp: new Date().toISOString(),
  };

  db.data.reports.push(newReport);
  await db.write();

  res.status(201).json({ message: 'Report submitted', report: newReport });
});

app.get('/api/reports', async (req, res) => {
  await db.read();
  res.json(db.data.reports);
});

const PORT = process.env.PORT || 5055;
app.listen(PORT, () => {
  console.log(`✅ SpeakUp AI Backend running at http://localhost:${PORT}`);
});
