import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import requestLogger from './middlewares/logger.js';
import { upload } from './middlewares/upload.js';
import reportsRouter from './routes/reports.js';
import { query } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5055;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', upload.single('evidence'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/reports', reportsRouter);

async function initDatabase() {
  console.log('Initializing SpeakUP PostgreSQL database...');
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        evidence_url TEXT,
        category VARCHAR(100) DEFAULT 'General',
        severity VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Submitted',
        latitude NUMERIC(9, 6),
        longitude NUMERIC(9, 6),
        admin_remarks TEXT,
        redacted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ PostgreSQL reports table initialized successfully.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`✅ SpeakUp Backend server running at http://localhost:${PORT}`);
  await initDatabase();
});
