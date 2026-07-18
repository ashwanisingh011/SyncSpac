import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getPlatformUsers,
  toggleBanUser,
  getPlatformOrganizations,
  toggleSuspendOrganization,
  changeOrganizationPlan,
  getPlatformStats,
  getPlatformAuditLogs,
  getUserGrowth,
  getSystemHealth,
  createOrganizationByAdmin
} from '../controllers/adminController.js';
import { UserRole } from '../types/roles.js';

const router = express.Router();

// Apply auth + superadmin check to all routes in this router
router.use(protect);
router.use(authorizeRoles(UserRole.SUPER_ADMIN));

router.get('/platform-users', getPlatformUsers);
router.patch('/users/:userId/toggle-ban', toggleBanUser);
router.get('/organizations', getPlatformOrganizations);
router.post('/organizations', createOrganizationByAdmin);
router.patch('/organizations/:orgId/toggle-suspend', toggleSuspendOrganization);
router.patch('/organizations/:orgId/plan', changeOrganizationPlan);
router.get('/stats', getPlatformStats);
router.get('/audit-logs', getPlatformAuditLogs);
router.get('/user-growth', getUserGrowth);
router.get('/system/health', getSystemHealth);

export default router;
