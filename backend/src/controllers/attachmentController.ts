import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Task from '../models/Task.js';
import TaskAttachment from '../models/TaskAttachment.js';
import { UserRole } from '../types/roles.js';
import { normalizeRoleCode } from '../utils/rbacMatrix.js';

const getOrganizationId = (req: Request): Types.ObjectId | null => {
  return req.user?.organization ? new Types.ObjectId(req.user.organization.toString()) : null;
};

// Create a new task attachment (upload file)
export const createAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
    const { taskId } = req.params;

    if (!organizationId || !requesterId) {
      if (req.file) {
        // Delete uploaded file from Cloudinary to avoid orphan files
        const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: resourceType });
      }
      res.status(403).json({ success: false, message: 'Organization or user not found', data: null });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded', data: null });
      return;
    }

    // Verify task exists and is scoped to organization
    const task = await Task.findOne({ _id: taskId, organization: organizationId }).select('_id');
    if (!task) {
      // Clean up Cloudinary file
      const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: resourceType });
      res.status(404).json({ success: false, message: 'Task not found or access denied', data: null });
      return;
    }

    // req.file properties supplied by multer-storage-cloudinary:
    // - originalname: original filename
    // - path: Cloudinary secure URL
    // - filename: Cloudinary public ID
    // - size: size in bytes
    // - mimetype: mime type
    const attachment = await TaskAttachment.create({
      task: task._id,
      uploadedBy: requesterId,
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      fileKey: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    const populatedAttachment = await attachment.populate('uploadedBy', 'firstName lastName username avatar');

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: populatedAttachment,
    });
  } catch (error: any) {
    if (req.file) {
      try {
        const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: resourceType });
      } catch (cleanupError) {
        console.error('Failed to clean up Cloudinary upload on error:', cleanupError);
      }
    }
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Retrieve all attachments for a specific task
export const getTaskAttachments = async (req: Request, res: Response): Promise<void> => {
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

    const attachments = await TaskAttachment.find({ task: taskId })
      .populate('uploadedBy', 'firstName lastName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Attachments fetched successfully',
      data: attachments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

// Delete an attachment (only uploader OR org admin/project manager can delete)
export const deleteAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
    const userRole = req.user?.role;
    const { taskId, attachmentId } = req.params;

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

    const attachment = await TaskAttachment.findById(attachmentId);
    if (!attachment) {
      res.status(404).json({ success: false, message: 'Attachment not found', data: null });
      return;
    }

    // RBAC: Uploader OR Admin roles can delete
    const isUploader = attachment.uploadedBy.toString() === requesterId.toString();
    const normalizedRole = normalizeRoleCode(userRole);
    const isAdmin = ['superadmin', 'org_admin', 'project_manager'].includes(normalizedRole);

    if (!isUploader && !isAdmin) {
      res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to delete this attachment', data: null });
      return;
    }

    // Remove from Cloudinary storage
    const resourceType = attachment.mimeType.startsWith('image/') ? 'image' : 'raw';
    await cloudinary.uploader.destroy(attachment.fileKey, { resource_type: resourceType });

    // Remove from Database
    await TaskAttachment.findByIdAndDelete(attachmentId);

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      data: null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};
