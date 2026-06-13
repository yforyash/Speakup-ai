import express from 'express';
import { query } from '../config/db.js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const openai = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai')
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function localFallbackAnalyze(description) {
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  let redactedDescription = description
    .replace(phoneRegex, '[REDACTED PHONE]')
    .replace(emailRegex, '[REDACTED EMAIL]');

  const descLower = description.toLowerCase();
  let severity = 'Low';
  
  const highKeywords = ['murder', 'bomb', 'kill', 'assault', 'violence', 'kidnap', 'weapon', 'firearm', 'rape', 'threat', 'murdered', 'killing', 'terror', 'stabbing', 'stabbed', 'attack'];
  const mediumKeywords = ['theft', 'steal', 'rob', 'fraud', 'scam', 'burglary', 'bribe', 'corruption', 'cheat', 'stole', 'stolen', 'robbed', 'bribery', 'hacked', 'hack'];
  
  if (highKeywords.some(keyword => descLower.includes(keyword))) {
    severity = 'High';
  } else if (mediumKeywords.some(keyword => descLower.includes(keyword))) {
    severity = 'Medium';
  }

  const sentences = description.split(/[.!?]+/);
  let summary = sentences[0].trim();
  if (summary.length > 80) {
    summary = summary.substring(0, 80) + '...';
  }
  if (!summary) {
    summary = 'Anonymous incident reported.';
  }

  return {
    description: redactedDescription,
    summary,
    severity
  };
}

// POST: Submit anonymous report
router.post('/', async (req, res) => {
  try {
    const { title, description, evidence_url, category, latitude, longitude, enable_redact } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    let finalDescription = description;
    let summary = 'Anonymous incident reported.';
    let severity = 'Medium';

    if (enable_redact && openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a secure safety analysis assistant. Process the report description to protect the user's anonymity: \n" +
                       "1. Redact any personally identifiable information (PII) like names, specific address details, phone numbers, or emails by replacing them with '[REDACTED]'. \n" +
                       "2. Categorize the severity level as exactly 'Low', 'Medium', or 'High' based on urgency/danger. \n" +
                       "3. Create a clean 1-sentence summary of the incident. \n" +
                       "Format your response as a JSON string with keys: 'redactedDescription', 'severity', 'summary'."
            },
            {
              role: "user",
              content: `Description: ${description}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        finalDescription = result.redactedDescription || description;
        severity = result.severity || 'Medium';
        summary = result.summary || 'Anonymous incident reported.';
      } catch (err) {
        console.error("OpenAI analysis failed, falling back to local processing:", err.message);
        const localAnalysis = localFallbackAnalyze(description);
        finalDescription = localAnalysis.description;
        summary = localAnalysis.summary;
        severity = localAnalysis.severity;
      }
    } else {
      const localAnalysis = localFallbackAnalyze(description);
      finalDescription = enable_redact ? localAnalysis.description : description;
      summary = localAnalysis.summary;
      severity = localAnalysis.severity;
    }

    const insertQuery = `
      INSERT INTO reports (title, description, evidence_url, category, severity, status, latitude, longitude, redacted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [
      title,
      finalDescription,
      evidence_url || null,
      category || 'General',
      severity,
      'Submitted',
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      enable_redact ? true : false
    ];

    const result = await query(insertQuery, params);
    res.status(201).json({ message: 'Report submitted successfully', report: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Retrieve all reports (Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const { category, severity, status } = req.query;
    
    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    if (severity) {
      sql += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }
    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Update report status / admin remarks
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_remarks } = req.body;

    const updateQuery = `
      UPDATE reports
      SET status = COALESCE($1, status),
          admin_remarks = COALESCE($2, admin_remarks)
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await query(updateQuery, [status, admin_remarks, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report updated successfully', report: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
