    import express from 'express';
    import { createTask, updateTaskStatus } from '../controllers/taskControllers.js';
    import { protect } from '../middleware/authMiddleware.js';

    const router = express.Router();

    router.post('/', protect, createTask)
    router.put('/:taskId/status', protect, updateTaskStatus)

    export default router;  