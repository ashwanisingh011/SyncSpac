import express from 'express'
import { rateLimit } from 'express-rate-limit';
import { protect } from '../middleware/auth.js'
import {
    archiveProject,
    assignUserToProject,
    createProject,
    getProjectById,
    getProjectMembers,
    getProjects,
    removeUserFromProject,
    updateProject
} from '../controllers/projectController.js'
import { authorizePermission, authorizeProjectMember } from '../middleware/permissionMiddleware.js';
import { validateProjectLimit } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();
const projectRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'production' ? 1000 : 100000, // Dynamic limit based on environment
    standardHeaders: true,
    legacyHeaders: false
});

router.use(projectRateLimit);
router.use(protect);

router.get('/', getProjects);
router.post('/', authorizePermission('create_project'), validateProjectLimit, createProject);
router.get('/:projectId/members', authorizeProjectMember, getProjectMembers);
router.get('/:projectId', authorizeProjectMember, getProjectById);
router.put('/:projectId', authorizeProjectMember, authorizePermission('edit_project'), updateProject);
router.patch('/:projectId/archive', authorizeProjectMember, authorizePermission('delete_project'), archiveProject);
router.post('/:projectId/assign', authorizeProjectMember, authorizePermission('manage_project_members'), assignUserToProject);
router.delete('/:projectId/members/:userId', authorizeProjectMember, authorizePermission('manage_project_members'), removeUserFromProject);

export default router;
