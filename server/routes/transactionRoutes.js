import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  batchImportTransactions
} from '../controllers/transactionController.js';
import { validateBody } from '../middleware/validate.js';
import {
  transactionSchema,
  updateTransactionSchema,
  batchTransactionSchema
} from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.post('/', validateBody(transactionSchema), createTransaction);
router.post('/batch-import', validateBody(batchTransactionSchema), batchImportTransactions);
router.get('/', getTransactions);
router.put('/:id', validateBody(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
