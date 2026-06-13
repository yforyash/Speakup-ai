import express from 'express';
import reportController from '../controllers/reportController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-incremented unique ID of the report
 *         title:
 *           type: string
 *           description: Title of the incident
 *         description:
 *           type: string
 *           description: Detailed description of the incident (possibly redacted)
 *         evidence_url:
 *           type: string
 *           description: URL of uploaded evidence file (image, video, PDF)
 *         category:
 *           type: string
 *           description: Category of the incident (e.g., Cyber Crime, Corruption)
 *         severity:
 *           type: string
 *           description: Severity level (Low, Medium, High)
 *         status:
 *           type: string
 *           description: Incident handling status (Submitted, Under Investigation, Action Taken, Resolved)
 *         latitude:
 *           type: number
 *           format: float
 *           description: GPS Latitude coordinates
 *         longitude:
 *           type: number
 *           format: float
 *           description: GPS Longitude coordinates
 *         admin_remarks:
 *           type: string
 *           description: Official remarks added by investigative officers
 *         redacted:
 *           type: boolean
 *           description: True if AI/local sanitization was applied
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the report was submitted
 */

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Submit a new anonymous incident report
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Phishing Scam Email"
 *               description:
 *                 type: string
 *                 example: "I received a fake banking email requesting login credentials from support@fakebank.com"
 *               evidence_url:
 *                 type: string
 *                 example: "http://localhost:5055/uploads/evidence-17182312.png"
 *               category:
 *                 type: string
 *                 example: "Cyber Crime"
 *               latitude:
 *                 type: number
 *                 example: 28.6139
 *               longitude:
 *                 type: number
 *                 example: 77.2090
 *               enable_redact:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 report:
 *                   $ref: '#/components/schemas/Report'
 *       500:
 *         description: Server error
 */
router.post('/', reportController.submitReport);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Retrieve a list of incident reports (Admin only)
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter reports by category
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter reports by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter reports by status
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 */
router.get('/', reportController.listReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Fetch a single report by ID (For public status tracking)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique Report ID
 *     responses:
 *       200:
 *         description: Report details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Report not found
 */
router.get('/:id', reportController.getReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   patch:
 *     summary: Update incident handling status and remarks (Admin only)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "Under Investigation"
 *               admin_remarks:
 *                 type: string
 *                 example: "Case assigned to Delhi Cyber Forensic Wing."
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 report:
 *                   $ref: '#/components/schemas/Report'
 *       404:
 *         description: Report not found
 */
router.patch('/:id', reportController.updateReport);

export default router;
