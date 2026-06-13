import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import requestLogger from './middlewares/logger.js';
import { upload } from './middlewares/upload.js';
import reportsRouter from './routes/reports.js';
import authRouter from './routes/auth.js';
import { query } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5055;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Swagger Documentation Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SpeakUp Anonymous Crime Reporting Portal API',
      version: '1.0.0',
      description: 'Official interactive Swagger API documentation for incident logs, media evidence uploads, and admin authentication workflows.',
      contact: {
        name: 'Ministry of Home Affairs - MHA IT Cell',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development Server',
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Uploads static directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload evidence media file (Images, Videos, PDFs)
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               evidence:
 *                 type: string
 *                 format: binary
 *                 description: Evidence file attachment (Max 50MB)
 *     responses:
 *       200:
 *         description: Media file securely uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileUrl:
 *                   type: string
 *                   example: "http://localhost:5055/uploads/evidence-17182312.png"
 *       400:
 *         description: File payload absent
 *       500:
 *         description: Server error
 */
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

// App Router mount
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);

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
    console.log('✅ PostgreSQL reports table initialized successfully in Cloud.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`✅ SpeakUp Backend server running at http://localhost:${PORT}`);
  console.log(`📑 Interactive API Documentation active at http://localhost:${PORT}/api-docs`);
  await initDatabase();
});
