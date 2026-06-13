import express from 'express';
import reportController from '../controllers/reportController.js';

const router = express.Router();

router.post('/', reportController.submitReport);
router.get('/', reportController.listReports);
router.get('/:id', reportController.getReport);
router.patch('/:id', reportController.updateReport);

export default router;
