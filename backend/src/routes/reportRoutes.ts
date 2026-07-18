import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { authorizePermission } from '../middleware/permissionMiddleware.js';
import {
  getSprintBurndown,
  getProjectVelocity
} from '../controllers/reportController.js';

const router = Router();

router.use(protect);

router.get('/sprints/:sprintId/burndown', authorizePermission('view_reports'), getSprintBurndown);
router.get('/projects/:projectId/velocity', authorizePermission('view_reports'), getProjectVelocity);

export default router;
