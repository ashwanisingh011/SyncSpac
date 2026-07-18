import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createRecurringTask,
  getRecurringTasks,
  updateRecurringTask,
  deleteRecurringTask,
} from '../controllers/recurringTaskController.js';

const router = express.Router();

router.use(protect);

router.post('/', createRecurringTask);
router.get('/', getRecurringTasks);
router.put('/:id', updateRecurringTask);
router.delete('/:id', deleteRecurringTask);

export default router;
