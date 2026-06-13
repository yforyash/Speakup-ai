import express from 'express';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate law enforcement officer credentials
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "Secure@HomeMHA2026"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'Secure@HomeMHA256') {
    res.json({
      success: true,
      token: 'mock-auth-jwt-token-mha-2026'
    });
  } else {
    res.status(401).json({
      error: 'Invalid Officer Badge ID or passcode coordinates.'
    });
  }
});

export default router;
