import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  createOrganization,
  inviteTeamMember,
  acceptInvitation
} from '../controllers/orgLifecycleController.js';
import { UserRole } from '../types/roles.js';

const router = express.Router();

// POST /api/org-lifecycle/create - Secured via protect and authorizeRoles(UserRole.ORG_ADMIN)
router.post('/create', protect, authorizeRoles(UserRole.ORG_ADMIN), createOrganization);

// POST /api/org-lifecycle/invite - Secured via protect and authorizeRoles(UserRole.ORG_ADMIN)
router.post('/invite', protect, authorizeRoles(UserRole.ORG_ADMIN), inviteTeamMember);

// POST /api/org-lifecycle/accept-invite/:token - Secured via protect and authorizeRoles(UserRole.MEMBER)
router.post('/accept-invite/:token', protect, authorizeRoles(UserRole.MEMBER), acceptInvitation);

export default router;
