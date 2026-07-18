import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { UserRole } from '../types/roles.js';
import {
  getActivePlans,
  getPlatformPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/billingController.js';

const router = express.Router();

// GET /api/plans - Public/Authenticated list of active plans
router.get('/', getActivePlans);

// Super Admin plan management routes
router.get('/admin', protect, authorizeRoles(UserRole.SUPER_ADMIN), getPlatformPlans);
router.post('/admin', protect, authorizeRoles(UserRole.SUPER_ADMIN), createPlan);
router.put('/admin/:code', protect, authorizeRoles(UserRole.SUPER_ADMIN), updatePlan);
router.delete('/admin/:code', protect, authorizeRoles(UserRole.SUPER_ADMIN), deletePlan);

export default router;
