import express from 'express';
import { protect } from '../middleware/auth.js';
import { authorizePermission } from '../middleware/permissionMiddleware.js';
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizePermission('manage_departments'), createDepartment);
router.get('/', getDepartments);
router.patch('/:id', authorizePermission('manage_departments'), updateDepartment);
router.delete('/:id', authorizePermission('manage_departments'), deleteDepartment);

export default router;
