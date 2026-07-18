import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import { ForbiddenError, UnauthorizedError, NotFoundError } from './errorMiddleware.js';
import {
  getAccessLevel,
  isSuperAdminRole,
  normalizeRoleCode,
  type PermissionCode,
} from '../utils/rbacMatrix.js';

async function userOwnsTask(
  userId: mongoose.Types.ObjectId,
  taskParam: string | undefined,
): Promise<boolean> {
  if (!taskParam) return false;

  let task;
  if (mongoose.Types.ObjectId.isValid(taskParam)) {
    task = await Task.findById(taskParam).select('createdBy assignedTo');
  } else {
    task = await Task.findOne({ taskKey: taskParam }).select('createdBy assignedTo');
  }

  if (!task) return false;

  const userIdStr = userId.toString();
  const isCreator = task.createdBy?.toString() === userIdStr;
  const isAssignee = task.assignedTo?.toString() === userIdStr;
  return isCreator || isAssignee;
}

async function resolveTaskIdFromRequest(req: Request): Promise<string | undefined> {
  const taskParam = (req.params.id || req.params.taskId || req.params.taskIdentifier) as
    | string
    | undefined;
  return taskParam;
}

/**
 * Reusable middleware to authorize users based on RBAC matrix + DB permission mappings.
 * SuperAdmin automatically bypasses all checks.
 */
export const authorizePermission = (permissionCode: PermissionCode) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User context not found');
      }

      const roleStr = req.user.role as string;
      if (isSuperAdminRole(roleStr)) {
        return next();
      }

      const accessLevel = getAccessLevel(roleStr, permissionCode);

      if (accessLevel === 'DENY') {
        throw new ForbiddenError(`Access denied: you do not have permission for ${permissionCode}`);
      }

      if (accessLevel === 'READ_ONLY') {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          throw new ForbiddenError('Access denied: read-only permission');
        }
        return next();
      }

      if (accessLevel === 'OWN') {
        const taskParam = await resolveTaskIdFromRequest(req);
        const userId = new mongoose.Types.ObjectId(req.user._id.toString());
        const ownsRecord = await userOwnsTask(userId, taskParam);

        if (!ownsRecord) {
          throw new ForbiddenError('Access denied: you can only modify your own tasks');
        }
        return next();
      }

      // ALLOW — verify DB mapping exists (or fallback to canonical in-memory matrix)
      const normalizedRole = normalizeRoleCode(roleStr);
      const role = await Role.findOne({ code: normalizedRole });
      if (role) {
        const permission = await Permission.findOne({ code: permissionCode });
        if (permission) {
          const hasPermission = await RolePermission.findOne({
            roleId: role._id,
            permissionId: permission._id,
          });
          if (hasPermission) {
            return next();
          }
        }
      }

      // Fallback: If DB mapping is missing or role/permission is not configured in DB,
      // check if the canonical in-memory RBAC matrix allows it.
      const fallbackLevel = getAccessLevel(roleStr, permissionCode);
      if (fallbackLevel === 'ALLOW') {
        return next();
      }

      throw new ForbiddenError(
        `Access denied: you do not have permission to perform this action`
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Scoping middleware to check if user has access to a project.
 * SuperAdmin and OrgAdmin automatically bypass this check.
 */
export const authorizeProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User context not found');
    }

    const roleStr = req.user.role as string;
    const normalized = normalizeRoleCode(roleStr);
    if (
      isSuperAdminRole(roleStr) ||
      ['org_admin', 'project_manager', 'team_lead'].includes(normalized)
    ) {
      return next();
    }

    let projectId = req.params.projectId || req.body.projectId || (req.query.projectId as string);

    const isTaskRoute = req.baseUrl.includes('tasks');
    const taskParam = (req.params.id || req.params.taskId || req.params.taskIdentifier) as
      | string
      | undefined;

    if (!projectId && taskParam && isTaskRoute) {
      let task;
      if (mongoose.Types.ObjectId.isValid(taskParam)) {
        task = await Task.findById(taskParam).select('project');
      } else {
        task = await Task.findOne({ taskKey: taskParam }).select('project');
      }

      if (!task) {
        throw new NotFoundError('Task not found');
      }
      projectId = task.project.toString();
    }

    const isSprintRoute = req.baseUrl.includes('sprints');
    if (!projectId && req.params.id && isSprintRoute) {
      const sprint = await Sprint.findById(req.params.id).select('projectId');
      if (!sprint) {
        throw new NotFoundError('Sprint not found');
      }
      projectId = sprint.projectId.toString();
    }

    if (!projectId) {
      return next();
    }

    const member = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });

    if (member) {
      return next();
    }

    const project = await Project.findById(projectId).select('owner');
    if (project && project.owner.toString() === req.user._id.toString()) {
      return next();
    }

    const taskAssigned = await Task.findOne({
      project: projectId,
      assignedTo: req.user._id,
    }).select('_id');

    if (taskAssigned) {
      return next();
    }

    throw new ForbiddenError('Access denied: you are not a member of this project');
  } catch (error) {
    next(error);
  }
};
