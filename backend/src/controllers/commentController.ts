import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Task from '../models/Task.js';
import TaskComment from '../models/TaskComment.js';
import { UserRole } from '../types/roles.js';
import { normalizeRoleCode } from '../utils/rbacMatrix.js';
import { parseAndNotifyMentions } from '../utils/mentions.js';
import { createNotifications, type CreateNotificationParams } from '../utils/notificationHelper.js';

const getOrganizationId = (req: Request): Types.ObjectId | null => {
  return req.user?.organization ? new Types.ObjectId(req.user.organization.toString()) : null;
};

// Create a new comment
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
    const { taskId } = req.params;
    const { content } = req.body;

    if (!organizationId || !requesterId) {
      res.status(403).json({ success: false, message: 'Organization or user not found', data: null });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Comment content is required', data: null });
      return;
    }

    // Verify task exists and is scoped to organization, fetching watchers, taskKey, title, and project
    const task = await Task.findOne({ _id: taskId, organization: organizationId }).select('_id watchers taskKey title project');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found or access denied', data: null });
      return;
    }

    const comment = await TaskComment.create({
      task: task._id,
      author: requesterId,
      content: content.trim(),
    });

    // Populate author details for immediate front-end render
    const populatedComment = await comment.populate([
      { path: 'author', select: 'firstName lastName username avatar' },
      { path: 'reactions.userId', select: 'firstName lastName username avatar' }
    ]);

    // 1. Parse and notify mentions first
    const notifiedMentionIds = await parseAndNotifyMentions(
      content.trim(),
      task._id,
      task.taskKey,
      task.title,
      requesterId,
      req.user?.firstName || 'A team member',
      [], // no pre-existing recipients yet
      'comment'
    );

    const notifiedMentionSet = new Set(notifiedMentionIds.map(id => id.toString()));

    // 2. Hook comment into the watcher system to emit a COMMENT_ADDED notification to all watchers (except those already notified via mention)
    const watcherIds = task.watchers || [];
    const recipients = watcherIds.filter(id => 
      id.toString() !== requesterId.toString() && !notifiedMentionSet.has(id.toString())
    );

    if (recipients.length > 0) {
      const notifications: CreateNotificationParams[] = recipients.map(recipientId => ({
        recipient: recipientId,
        sender: requesterId,
        type: 'COMMENT_ADDED',
        title: `New Comment on ${task.taskKey}`,
        message: `${req.user?.firstName || 'A team member'} commented on "${task.title}": "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
        relatedEntity: task._id,
        entityModel: 'Task',
      }));

      await createNotifications(notifications);
    }

    try {
      const { getIO } = await import('../config/socket.js');
      if (task.project) {
        getIO().to(task.project.toString()).emit('comment:created', { comment: populatedComment, taskId: task._id });
      }
    } catch (err) {}

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: populatedComment,
    });
  } catch (error: any) {

    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Fetch all comments for a specific task
export const getTaskComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const { taskId } = req.params;

    if (!organizationId) {
      res.status(403).json({ success: false, message: 'Organization not found', data: null });
      return;
    }

    // Verify task access
    const task = await Task.findOne({ _id: taskId, organization: organizationId }).select('_id');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found or access denied', data: null });
      return;
    }

    const comments = await TaskComment.find({ task: taskId })
      .populate('author', 'firstName lastName username avatar')
      .populate('reactions.userId', 'firstName lastName username avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      data: comments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Edit a comment (only author is allowed to edit)
export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
    const { taskId, commentId } = req.params;
    const { content } = req.body;

    if (!organizationId || !requesterId) {
      res.status(403).json({ success: false, message: 'Organization or user not found', data: null });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Comment content cannot be empty', data: null });
      return;
    }

    // Verify task exists and is scoped to organization
    const task = await Task.findOne({ _id: taskId, organization: organizationId }).select('_id');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found or access denied', data: null });
      return;
    }

    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found', data: null });
      return;
    }

    // Strict Author Check for Editing comments
    if (comment.author.toString() !== requesterId.toString()) {
      res.status(403).json({ success: false, message: 'Forbidden: Only the author can edit this comment', data: null });
      return;
    }

    comment.content = content.trim();
    await comment.save();

    const populatedComment = await comment.populate([
      { path: 'author', select: 'firstName lastName username avatar' },
      { path: 'reactions.userId', select: 'firstName lastName username avatar' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: populatedComment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Delete a comment (author OR org-level admin/project manager can delete)
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
    const userRole = req.user?.role;
    const { taskId, commentId } = req.params;

    if (!organizationId || !requesterId || !userRole) {
      res.status(403).json({ success: false, message: 'Organization or user not found', data: null });
      return;
    }

    // Verify task exists and is scoped to organization
    const task = await Task.findOne({ _id: taskId, organization: organizationId }).select('_id');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found or access denied', data: null });
      return;
    }

    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found', data: null });
      return;
    }

    // RBAC: Author OR Admin role (Super Admin, Org Admin, Project Manager) can delete
    const isAuthor = comment.author.toString() === requesterId.toString();
    const normalizedRole = normalizeRoleCode(userRole);
    const isAdmin = ['superadmin', 'org_admin', 'project_manager'].includes(normalizedRole);

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to delete this comment', data: null });
      return;
    }

    await TaskComment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

/**
 * @desc    Toggle emoji reaction on a comment
 * @route   POST /api/tasks/:taskId/comments/:commentId/react
 * @access  Private
 */
export const toggleCommentReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId, commentId } = req.params;
    const { emoji } = req.body;
    const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;

    if (!requesterId) {
      res.status(403).json({ success: false, message: 'User context not found', data: null });
      return;
    }

    if (!emoji || !emoji.trim()) {
      res.status(400).json({ success: false, message: 'Emoji character is required', data: null });
      return;
    }

    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found', data: null });
      return;
    }

    // Verify task match
    if (comment.task.toString() !== taskId) {
      res.status(400).json({ success: false, message: 'Comment does not match task reference', data: null });
      return;
    }

    // Toggle reaction logic
    const existingIndex = comment.reactions.findIndex(
      (r) => r.userId.toString() === requesterId.toString() && r.emoji === emoji.trim()
    );

    if (existingIndex > -1) {
      // Remove reaction
      comment.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      comment.reactions.push({
        userId: requesterId,
        emoji: emoji.trim()
      });
    }

    await comment.save();

    const populatedComment = await comment.populate([
      { path: 'author', select: 'firstName lastName username avatar' },
      { path: 'reactions.userId', select: 'firstName lastName username avatar' }
    ]);

    // Emit live socket event to notify other collaborative viewers
    try {
      const { getIO } = await import('../config/socket.js');
      const task = await Task.findById(taskId).select('project');
      if (task?.project) {
        getIO().to(task.project.toString()).emit('comment:updated', { comment: populatedComment, taskId });
      }
    } catch (err) {}

    res.status(200).json({
      success: true,
      message: 'Comment reaction toggled successfully',
      data: populatedComment
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
