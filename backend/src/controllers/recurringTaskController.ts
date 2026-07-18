import { Request, Response } from 'express';
import { Types } from 'mongoose';
import cronParser from 'cron-parser';
import RecurringTask from '../models/RecurringTask.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import OrganizationMember from '../models/OrganizationMember.js';
import Label from '../models/Label.js';
import { UserRole } from '../types/roles.js';

const getOrganizationId = (req: Request): Types.ObjectId | null => {
  return req.user?.organization ? new Types.ObjectId(req.user.organization.toString()) : null;
};

const getIdentifier = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }
  return null;
};

type AssigneeResolution = {
  assigneeId: Types.ObjectId | undefined;
  error?: { status: number; message: string };
};

const resolveRecurringAssignee = async (
  value: unknown,
  organizationId: Types.ObjectId
): Promise<AssigneeResolution> => {
  const rawAssigneeId = getIdentifier(value);

  if (!rawAssigneeId) return { assigneeId: undefined };

  if (!Types.ObjectId.isValid(rawAssigneeId)) {
    return { assigneeId: undefined, error: { status: 400, message: 'Invalid assignee ID' } };
  }

  const assigneeId = new Types.ObjectId(rawAssigneeId);
  const [assignee, organizationMember] = await Promise.all([
    User.findOne({ _id: assigneeId, isActive: true }).select('role'),
    OrganizationMember.findOne({ organization: organizationId, user: assigneeId }).select('role status')
  ]);

  if (!assignee) {
    return { assigneeId: undefined, error: { status: 404, message: 'Assignee not found' } };
  }

  if (!organizationMember || organizationMember.status !== 'active') {
    return {
      assigneeId: undefined,
      error: { status: 400, message: 'Only active workspace members can be assigned tasks' }
    };
  }

  const roleText = `${assignee.role ?? ''} ${organizationMember?.role ?? ''}`.toLowerCase();
  if (roleText.includes(UserRole.CLIENT)) {
    return {
      assigneeId: undefined,
      error: { status: 400, message: 'Client users cannot be assigned tasks' }
    };
  }

  return { assigneeId };
};

export const createRecurringTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;

    if (!organizationId || !requesterId) {
      res.status(403).json({ success: false, message: 'Organization or user not found', data: null });
      return;
    }

    const {
      projectId: rawProjectId,
      title,
      description,
      type,
      priority,
      estimatedTime,
      assignee,
      labels,
      cronExpression,
    } = req.body;

    const projectId = getIdentifier(rawProjectId);
    if (!projectId || !title || !cronExpression) {
      res.status(400).json({ success: false, message: 'Project ID, title, and cron expression are required', data: null });
      return;
    }

    // Verify project belongs to organization
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId,
    }).select('_id');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found or access denied', data: null });
      return;
    }

    const assigneeResolution = await resolveRecurringAssignee(assignee, organizationId);
    if (assigneeResolution.error) {
      res.status(assigneeResolution.error.status).json({
        success: false,
        message: assigneeResolution.error.message,
        data: null
      });
      return;
    }

    // Verify labels belong to the organization if provided
    if (labels && Array.isArray(labels) && labels.length > 0) {
      const validLabelsCount = await Label.countDocuments({
        _id: { $in: labels },
        organization: organizationId,
      });
      if (validLabelsCount !== labels.length) {
        res.status(400).json({ success: false, message: 'One or more provided labels are invalid', data: null });
        return;
      }
    }

    // Validate cron expression and calculate nextRunTime
    let nextRunTime: Date;
    try {
      const parser = (cronParser as any).default || cronParser;
      const interval = parser.parse(cronExpression.trim());
      nextRunTime = interval.next().toDate();
    } catch (error: any) {
      res.status(400).json({ success: false, message: `Invalid cron expression: ${error.message}`, data: null });
      return;
    }

    const recurringTask = new RecurringTask({
      organization: organizationId,
      project: project._id,
      title: title.trim(),
      description: description?.trim(),
      type: type || 'task',
      priority: priority || 'medium',
      estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      assignee: assigneeResolution.assigneeId,
      labels: labels ? labels.map((l: string) => new Types.ObjectId(l)) : [],
      cronExpression: cronExpression.trim(),
      nextRunTime,
      createdBy: requesterId,
    });

    await recurringTask.save();

    res.status(201).json({
      success: true,
      message: 'Recurring task template created successfully',
      data: recurringTask,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

export const getRecurringTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    if (!organizationId) {
      res.status(403).json({ success: false, message: 'Organization not found', data: null });
      return;
    }

    const filter: Record<string, any> = { organization: organizationId };

    const projectId = getIdentifier(req.query.projectId);
    if (projectId) {
      filter.project = new Types.ObjectId(projectId);
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const recurringTasks = await RecurringTask.find(filter)
      .populate('project', '_id name')
      .populate('assignee', '_id username firstName lastName')
      .populate('labels', '_id name color')
      .populate('createdBy', '_id username firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Recurring task templates retrieved successfully',
      data: recurringTasks,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

export const updateRecurringTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const recurringTaskId = getIdentifier(req.params.id);

    if (!organizationId || !recurringTaskId) {
      res.status(403).json({ success: false, message: 'Organization or template ID not found', data: null });
      return;
    }

    const template = await RecurringTask.findOne({ _id: recurringTaskId, organization: organizationId });
    if (!template) {
      res.status(404).json({ success: false, message: 'Recurring task template not found', data: null });
      return;
    }

    const updatePayload: Record<string, any> = {};

    if (req.body.title !== undefined) updatePayload.title = req.body.title.trim();
    if (req.body.description !== undefined) updatePayload.description = req.body.description?.trim();
    if (req.body.type !== undefined) updatePayload.type = req.body.type;
    if (req.body.priority !== undefined) updatePayload.priority = req.body.priority;
    if (req.body.estimatedTime !== undefined) updatePayload.estimatedTime = req.body.estimatedTime ? Number(req.body.estimatedTime) : undefined;
    if (req.body.assignee !== undefined) {
      const assigneeResolution = await resolveRecurringAssignee(req.body.assignee, organizationId);
      if (assigneeResolution.error) {
        res.status(assigneeResolution.error.status).json({
          success: false,
          message: assigneeResolution.error.message,
          data: null
        });
        return;
      }
      updatePayload.assignee = assigneeResolution.assigneeId;
    }
    if (req.body.labels !== undefined) updatePayload.labels = req.body.labels.map((l: string) => new Types.ObjectId(l));
    if (req.body.isActive !== undefined) updatePayload.isActive = !!req.body.isActive;

    if (req.body.cronExpression !== undefined && req.body.cronExpression.trim() !== template.cronExpression) {
      const newCron = req.body.cronExpression.trim();
      try {
        const parser = (cronParser as any).default || cronParser;
        const interval = parser.parse(newCron);
        updatePayload.cronExpression = newCron;
        updatePayload.nextRunTime = interval.next().toDate();
      } catch (error: any) {
        res.status(400).json({ success: false, message: `Invalid cron expression: ${error.message}`, data: null });
        return;
      }
    } else if (req.body.isActive === true && template.isActive === false) {
      // If toggled from inactive to active, recalculate nextRunTime starting from now
      try {
        const parser = (cronParser as any).default || cronParser;
        const interval = parser.parse(template.cronExpression);
        updatePayload.nextRunTime = interval.next().toDate();
      } catch (error: any) {
        // Should not fail since template's existing cron was already validated
      }
    }

    const updatedTemplate = await RecurringTask.findOneAndUpdate(
      { _id: recurringTaskId, organization: organizationId },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Recurring task template updated successfully',
      data: updatedTemplate,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};

export const deleteRecurringTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = getOrganizationId(req);
    const recurringTaskId = getIdentifier(req.params.id);

    if (!organizationId || !recurringTaskId) {
      res.status(403).json({ success: false, message: 'Organization or template ID not found', data: null });
      return;
    }

    const result = await RecurringTask.deleteOne({ _id: recurringTaskId, organization: organizationId });
    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: 'Recurring task template not found', data: null });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Recurring task template deleted successfully',
      data: null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
  }
};
