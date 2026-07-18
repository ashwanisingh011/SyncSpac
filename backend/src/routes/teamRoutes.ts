import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorizePermission } from '../middleware/permissionMiddleware.js';
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from '../controllers/teamController.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizePermission('manage_team'), createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.patch('/:id', authorizePermission('manage_team'), updateTeam);
router.delete('/:id', authorizePermission('manage_team'), deleteTeam);
router.post('/:id/members', authorizePermission('manage_team'), addTeamMember);
router.delete('/:id/members/:userId', authorizePermission('manage_team'), removeTeamMember);

export default router;
