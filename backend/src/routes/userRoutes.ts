import { Router } from 'express';
import { updateProfile, getProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);

export default router;
