import express from 'express';
import { createWorkspace, getWorkspace } from '../controllers/workspaceControllers.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createWorkspace)
router.get ('/:id', protect, getWorkspace)
export default router;