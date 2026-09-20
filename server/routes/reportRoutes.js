import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMonthlyReport } from '../controllers/reportController.js';
import { validateQuery } from '../middleware/validate.js';
import { reportQuerySchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);
router.get('/monthly', validateQuery(reportQuerySchema), getMonthlyReport);

export default router;
