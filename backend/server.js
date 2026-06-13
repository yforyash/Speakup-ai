import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { query } from './config/db.js';
import reportsRouter from './routes/reports.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5055;

// Enable CORS
app.use(cors());
app.use(express.json());

// Auto-create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// File upload API endpoint
app.post('/api/upload', upload.single('evidence'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return relative URL to file
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mount reports route
app.use('/api/reports', reportsRouter);

// Initialize DB schema
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

// Start Server
app.listen(PORT, async () => {
  console.log(`✅ SpeakUp Backend server running at http://localhost:${PORT}`);
  await initDatabase();
});
