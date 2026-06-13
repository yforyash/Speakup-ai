import { query } from '../config/db.js';

async function insertReport({ title, description, evidence_url, category, severity, latitude, longitude, redacted }) {
  const sql = `
    INSERT INTO reports (title, description, evidence_url, category, severity, status, latitude, longitude, redacted)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const params = [
    title,
    description,
    evidence_url || null,
    category || 'General',
    severity || 'Medium',
    'Submitted',
    latitude ? parseFloat(latitude) : null,
    longitude ? parseFloat(longitude) : null,
    redacted ? true : false
  ];
  
  const result = await query(sql, params);
  return result.rows[0];
}

async function getReportsList({ category, severity, status } = {}) {
  let sql = 'SELECT * FROM reports WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (category && category !== 'All') {
    sql += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }
  if (severity && severity !== 'All') {
    sql += ` AND severity = $${paramIndex}`;
    params.push(severity);
    paramIndex++;
  }
  if (status && status !== 'All') {
    sql += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

async function updateReportStatusAndRemarks(id, { status, admin_remarks }) {
  const sql = `
    UPDATE reports
    SET status = COALESCE($1, status),
        admin_remarks = COALESCE($2, admin_remarks)
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await query(sql, [status, admin_remarks, id]);
  return result.rows[0];
}

export default {
  insertReport,
  getReportsList,
  updateReportStatusAndRemarks
};
