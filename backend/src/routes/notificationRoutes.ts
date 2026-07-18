import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

// Protect all notification endpoints
router.use(protect);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
