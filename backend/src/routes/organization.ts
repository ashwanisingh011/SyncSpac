import express from 'express'
import { rateLimit } from 'express-rate-limit';
import {
    acceptWorkspaceInvite,
    getMyWorkspaces,
    getWorkspaceMembers,
    inviteUserToWorkspace,
    removeMember,
    getWorkspaceSettings,
    updateMemberRole,
    updateWorkspaceSettings,
    createOrganization,
    deleteWorkspace,
    getWorkspaceRoles,
    updateWorkspacePlan,
    validateWorkspaceInvite,
} from '../controllers/orgController.js'
import {
    getWorkspaceBillingInfo,
    changeWorkspacePlan,
    processWorkspaceCheckout,
    createWorkspaceBillingOrder,
    handleRazorpayWebhook
} from '../controllers/billingController.js'
import {protect} from '../middleware/auth.js'
import { validateMemberLimit, validateRoleAssignment } from '../middleware/subscriptionMiddleware.js'



const router = express.Router();
const organizationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'production' ? 2000 : 100000, // Dynamic limit based on environment
    standardHeaders: true,
    legacyHeaders: false
});

router.use(organizationRateLimit);
router.post('/',protect,createOrganization);
router.get('/invitation/:token/validate', validateWorkspaceInvite);
router.delete('/:orgId',protect, deleteWorkspace);
router.get('/my-workspaces', protect, getMyWorkspaces);
router.get('/:orgId/settings', protect, getWorkspaceSettings);
router.patch('/:orgId/settings', protect, updateWorkspaceSettings);
router.get('/:orgId/roles', protect, getWorkspaceRoles);
router.get('/:orgId/members', protect, getWorkspaceMembers);
router.patch('/:orgId/members/:memberId/role', protect, updateMemberRole);
router.delete('/:orgId/members/:memberId', protect, removeMember);
router.post('/:orgId/invite', protect, validateMemberLimit, validateRoleAssignment, inviteUserToWorkspace);
router.post('/accept-invite/:token', protect, acceptWorkspaceInvite);
router.patch('/:orgId/plan', protect, updateWorkspacePlan);

// Billing routes
router.post('/billing/webhook', handleRazorpayWebhook);
router.get('/:orgId/billing', protect, getWorkspaceBillingInfo);
router.post('/:orgId/billing/change-plan', protect, changeWorkspacePlan);
router.post('/:orgId/billing/create-order', protect, createWorkspaceBillingOrder);
router.post('/:orgId/billing/checkout', protect, processWorkspaceCheckout);

export default router;
