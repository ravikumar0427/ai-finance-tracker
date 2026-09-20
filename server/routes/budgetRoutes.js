import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { setBudget, getBudget, updateBudget } from '../controllers/budgetController.js';
import { validateBody } from '../middleware/validate.js';
import { budgetSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.post('/', validateBody(budgetSchema), setBudget);
router.get('/', getBudget);
router.put('/', validateBody(budgetSchema), updateBudget);

export default router;
