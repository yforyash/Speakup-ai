import reportService from '../services/reportService.js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

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

async function submitReport(req, res) {
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

    const report = await reportService.insertReport({
      title,
      description: finalDescription,
      evidence_url,
      category,
      severity,
      latitude,
      longitude,
      redacted: enable_redact
    });

    res.status(201).json({ message: 'Report submitted successfully', report });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listReports(req, res) {
  try {
    const { category, severity, status } = req.query;
    const reports = await reportService.getReportsList({ category, severity, status });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateReport(req, res) {
  try {
    const { id } = req.params;
    const { status, admin_remarks } = req.body;

    const report = await reportService.updateReportStatusAndRemarks(id, { status, admin_remarks });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report updated successfully', report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getReport(req, res) {
  try {
    const { id } = req.params;
    const report = await reportService.getReportById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default {
  submitReport,
  listReports,
  updateReport,
  getReport
};

