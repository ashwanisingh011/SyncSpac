    import express from 'express';
    import { createTask } from '../controllers/taskControllers.js';
    import { protect } from '../middleware/authMiddleware.js';

    const router = express.Router();

    router.post('/', protect, createTask)

    export default router;  