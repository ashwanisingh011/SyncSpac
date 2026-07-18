import { Router } from 'express';
import { createSprint, startSprint, completeSprint, getSprintsByProject } from '../controllers/sprintController.js';
import { protect } from '../middleware/auth.js'
import { authorizePermission, authorizeProjectMember } from '../middleware/permissionMiddleware.js';

const router = Router();

router.use(protect);

/**
 * @route   POST /api/v1/sprints/project/:projectId
 * @desc    Create a planned sprint container linked to a project
 */
router.post('/project/:projectId', authorizeProjectMember, authorizePermission('manage_sprint'), createSprint);

/**
 * @route   GET /api/v1/sprints/project/:projectId
 * @desc    Get all sprints linked to a project
 */
router.get('/project/:projectId', authorizeProjectMember, getSprintsByProject);

/**
 * @route   POST /api/v1/sprints/:id/start
 * @desc    Pushes a sprint from 'planned' to 'active'
 */
router.post('/:id/start', authorizeProjectMember, authorizePermission('manage_sprint'), startSprint);

/**
 * @route   POST /api/v1/sprints/:id/complete
 * @desc    Calculates metrics, velocity, and returns unfinished items to the backlog
 */
router.post('/:id/complete', authorizeProjectMember, authorizePermission('manage_sprint'), completeSprint);

export default router;