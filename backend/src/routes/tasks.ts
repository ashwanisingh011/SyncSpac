import express from 'express'
import { rateLimit } from 'express-rate-limit';
import { protect } from '../middleware/auth.js'
import {
  createTask,
  deleteTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  watchTask,
  unwatchTask,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  attachLabel,
  detachLabel,
  getTaskHistory,
  logTime,
  getTaskTimeLogs,
  deleteTimeLog,
  reorderTasks,
  addDependency,
  removeDependency,
  getTaskDependencies
} from '../controllers/taskController.js'
import { createComment, getTaskComments, updateComment, deleteComment, toggleCommentReaction } from '../controllers/commentController.js'
import { createAttachment, getTaskAttachments, deleteAttachment } from '../controllers/attachmentController.js'
import { uploadAttachment } from '../config/cloudinary.js'
import { authorizePermission, authorizeProjectMember } from '../middleware/permissionMiddleware.js'
import { validateStorageLimit } from '../middleware/subscriptionMiddleware.js'


const router = express.Router();
const taskRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'production' ? 3000 : 100000, // Dynamic limit based on environment
    standardHeaders: true,
    legacyHeaders: false
});

router.use(taskRateLimit);
router.use(protect);

router.post('/', authorizePermission('create_task'), createTask);
router.post('/reorder', reorderTasks);
router.get('/project/:projectId', authorizeProjectMember, getProjectTasks);
router.get('/:taskIdentifier', authorizeProjectMember, getTaskById);
router.put('/:id', authorizeProjectMember, authorizePermission('edit_task'), updateTask);
router.delete('/:id', authorizeProjectMember, authorizePermission('delete_task'), deleteTask);

// Watchers
router.post('/:id/watch', authorizeProjectMember, watchTask);
router.post('/:id/unwatch', authorizeProjectMember, unwatchTask);

// Comments
router.post('/:taskId/comments', authorizeProjectMember, createComment);
router.get('/:taskId/comments', authorizeProjectMember, getTaskComments);
router.put('/:taskId/comments/:commentId', authorizeProjectMember, updateComment);
router.delete('/:taskId/comments/:commentId', authorizeProjectMember, deleteComment);
router.post('/:taskId/comments/:commentId/react', authorizeProjectMember, toggleCommentReaction);

// Checklist
router.post('/:id/checklist', authorizeProjectMember, authorizePermission('edit_task'), addChecklistItem);
router.put('/:id/checklist/:itemId', authorizeProjectMember, authorizePermission('edit_task'), updateChecklistItem);
router.delete('/:id/checklist/:itemId', authorizeProjectMember, authorizePermission('edit_task'), deleteChecklistItem);

// Labels
router.post('/:id/labels', authorizeProjectMember, authorizePermission('edit_task'), attachLabel);
router.delete('/:id/labels', authorizeProjectMember, authorizePermission('edit_task'), detachLabel);

// Attachments
router.post('/:taskId/attachments', authorizeProjectMember, uploadAttachment.single('attachment'), validateStorageLimit(req => req.file?.size || 0), createAttachment);
router.get('/:taskId/attachments', authorizeProjectMember, getTaskAttachments);
router.delete('/:taskId/attachments/:attachmentId', authorizeProjectMember, deleteAttachment);

// History
router.get('/:id/history', authorizeProjectMember, getTaskHistory);

// Time Tracking
router.post('/:id/time-logs', authorizeProjectMember, logTime);
router.get('/:id/time-logs', authorizeProjectMember, getTaskTimeLogs);
router.delete('/:id/time-logs/:logId', authorizeProjectMember, deleteTimeLog);

// Dependencies
router.post('/:id/dependencies', authorizeProjectMember, authorizePermission('edit_task'), addDependency);
router.get('/:id/dependencies', authorizeProjectMember, getTaskDependencies);
router.delete('/:id/dependencies/:dependencyId', authorizeProjectMember, authorizePermission('edit_task'), removeDependency);

export default router;

