import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { Types } from 'mongoose';
import Role from '../models/Role.js';
import { getOrgSubscriptionStatus, sendLimitExceededEmail } from '../utils/subscription.js';

export const validateMemberLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.params.orgId || req.body.orgId || req.user?.organization;
    if (!orgId) {
      next();
      return;
    }

    if (!Types.ObjectId.isValid(orgId.toString())) {
      res.status(400).json({ success: false, message: 'Invalid Organization ID.' });
      return;
    }

    const status = await getOrgSubscriptionStatus(orgId.toString());
    if (status.limits.users !== -1 && status.usage.users >= status.limits.users) {
      sendLimitExceededEmail(orgId.toString(), 'Users/Members', `${status.usage.users}`, `${status.limits.users}`);
      res.status(403).json({
        success: false,
        message: `Member limit of ${status.limits.users} exceeded for your current plan (${status.planName}). Please upgrade your subscription.`,
        type: 'LIMIT_EXCEEDED',
        limitType: 'users',
        currentUsage: status.usage.users,
        allowedLimit: status.limits.users,
      });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateProjectLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.params.orgId || req.body.orgId || req.user?.organization;
    if (!orgId) {
      next();
      return;
    }

    if (!Types.ObjectId.isValid(orgId.toString())) {
      res.status(400).json({ success: false, message: 'Invalid Organization ID.' });
      return;
    }

    const status = await getOrgSubscriptionStatus(orgId.toString());
    if (status.limits.projects !== -1 && status.usage.projects >= status.limits.projects) {
      sendLimitExceededEmail(orgId.toString(), 'Projects', `${status.usage.projects}`, `${status.limits.projects}`);
      res.status(403).json({
        success: false,
        message: `Project limit of ${status.limits.projects} exceeded for your current plan (${status.planName}). Please upgrade your subscription.`,
        type: 'LIMIT_EXCEEDED',
        limitType: 'projects',
        currentUsage: status.usage.projects,
        allowedLimit: status.limits.projects,
      });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateStorageLimit = (getUploadSize: (req: Request) => number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user?.organization;
      if (!orgId) {
        next();
        return;
      }

      if (!Types.ObjectId.isValid(orgId.toString())) {
        res.status(400).json({ success: false, message: 'Invalid Organization ID.' });
        return;
      }

      const status = await getOrgSubscriptionStatus(orgId.toString());
      if (status.limits.storage === -1) {
        next();
        return;
      }

      const uploadSizeBytes = getUploadSize(req);
      const totalBytesAfterUpload = status.usage.storageBytes + uploadSizeBytes;
      const totalGBAfterUpload = totalBytesAfterUpload / (1024 * 1024 * 1024);

      if (totalGBAfterUpload > status.limits.storage) {
        // Clean up Cloudinary upload to avoid orphan storage usage
        if (req.file) {
          try {
            let resourceType: 'image' | 'video' | 'raw' = 'raw';
            if (req.file.mimetype.startsWith('image/')) {
              resourceType = 'image';
            } else if (req.file.mimetype.startsWith('video/')) {
              resourceType = 'video';
            }
            await cloudinary.uploader.destroy(req.file.filename, { resource_type: resourceType });
          } catch (cleanupError) {
            console.error('Failed to clean up Cloudinary file on storage limit exceed:', cleanupError);
          }
        }

        sendLimitExceededEmail(orgId.toString(), 'Storage', `${status.usage.storageGB.toFixed(4)} GB`, `${status.limits.storage} GB`);
        res.status(403).json({
          success: false,
          message: `Storage limit of ${status.limits.storage} GB exceeded for your current plan (${status.planName}). Please upgrade your subscription.`,
          type: 'LIMIT_EXCEEDED',
          limitType: 'storage',
          currentUsage: status.usage.storageGB,
          allowedLimit: status.limits.storage,
        });
        return;
      }
      next();

    } catch (error) {
      next(error);
    }
  };
};

export const validateCustomRolesFeature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.params.orgId || req.body.orgId || req.user?.organization;
    if (!orgId) {
      next();
      return;
    }

    if (!Types.ObjectId.isValid(orgId.toString())) {
      res.status(400).json({ success: false, message: 'Invalid Organization ID.' });
      return;
    }

    const status = await getOrgSubscriptionStatus(orgId.toString());
    if (!status.limits.customRoles) {
      sendLimitExceededEmail(orgId.toString(), 'Custom Roles Feature', 'Attempted usage', 'Not included in plan');
      res.status(403).json({
        success: false,
        message: `Custom Roles are not supported on your current plan (${status.planName}). Please upgrade your subscription.`,
        type: 'LIMIT_EXCEEDED',
        limitType: 'customRoles',
        currentUsage: 0,
        allowedLimit: 0,
      });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateRoleAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.params.orgId || req.body.orgId || req.user?.organization;
    const roleCode = req.body.role;
    if (!orgId || !roleCode) {
      next();
      return;
    }

    if (!Types.ObjectId.isValid(orgId.toString())) {
      res.status(400).json({ success: false, message: 'Invalid Organization ID.' });
      return;
    }

    const targetRole = await Role.findOne({ code: roleCode });
    if (targetRole && !targetRole.isDefault) {
      const status = await getOrgSubscriptionStatus(orgId.toString());
      if (!status.limits.customRoles) {
        sendLimitExceededEmail(orgId.toString(), 'Custom Roles', '1', '0');
        res.status(403).json({ 
          success: false, 
          message: `Custom Roles are not supported on your current plan (${status.planName}). Please upgrade your subscription.`,
          type: 'LIMIT_EXCEEDED',
          limitType: 'customRoles',
          currentUsage: 0,
          allowedLimit: 0,
        });
        return;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

