import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { globalSearch } from '../controllers/searchController.js';

const router = Router();

// Protect search endpoint
router.get('/', protect, globalSearch);

export default router;
