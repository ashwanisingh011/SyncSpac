import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { createLabel, getLabels, updateLabel, deleteLabel } from '../controllers/labelController.js';

const router = express.Router();

const labelRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 1000 : 100000, // Dynamic limit based on environment
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(labelRateLimit);
router.use(protect);

router.post('/', createLabel);
router.get('/', getLabels);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);

export default router;
