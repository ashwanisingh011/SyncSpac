import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import TaskHistory from '../models/TaskHistory.js';
import ProjectMember from '../models/ProjectMember.js';
import Project from '../models/Project.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorMiddleware.js';
import { normalizeRoleCode, isSuperAdminRole } from '../utils/rbacMatrix.js';

// Check project membership helper
const validateProjectMembership = async (projectId: string, userId: string, userRole: string) => {
  const normalized = normalizeRoleCode(userRole);
  if (
    isSuperAdminRole(userRole) ||
    ['org_admin', 'project_manager', 'team_lead'].includes(normalized)
  ) return true;

  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new BadRequestError('Invalid Project ID or User ID');
  }
  
  const project = await Project.findById(projectId).select('owner organization');
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Directly check database organization membership to make permission check resilient
  if (project.organization) {
    const orgMember = await mongoose.model('OrganizationMember').findOne({
      organization: project.organization,
      user: new mongoose.Types.ObjectId(userId),
      status: 'active'
    });
    if (orgMember && ['org_admin', 'project_manager', 'team_lead'].includes(normalizeRoleCode(orgMember.role))) {
      return true;
    }
  }

  const membership = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId)
  });
  
  if (membership) return true;

  if (project.owner?.toString() === userId) {
    return true;
  }

  const taskAssigned = await Task.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: new mongoose.Types.ObjectId(userId),
  }).select('_id');

  if (taskAssigned) {
    return true;
  }

  throw new ForbiddenError('You are not a member of this project');
};

/**
 * @desc    Get Sprint Burndown Chart Data
 * @route   GET /api/reports/sprints/:sprintId/burndown
 * @access  Private
 */
export const getSprintBurndown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      throw new NotFoundError('Sprint not found');
    }

    await validateProjectMembership(sprint.projectId.toString(), req.user!._id.toString(), req.user!.role);

    // Fetch all tasks associated with this sprint
    const tasks = await Task.find({ sprintId: sprint._id });

    // Calculate total story points and task count in the sprint
    let totalPoints = 0;
    tasks.forEach(t => {
      totalPoints += t.storyPoints || 1; // Default to 1 point if storyPoints is not set
    });

    // Determine sprint start date and end date
    const start = sprint.startDate ? new Date(sprint.startDate) : new Date((sprint as any).createdAt);
    const end = sprint.endDate ? new Date(sprint.endDate) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000); // Default to 14 days later

    // Generate list of days in the sprint
    const days: Date[] = [];
    const currentDay = new Date(start);
    currentDay.setHours(0, 0, 0, 0);
    const finalDay = new Date(end);
    finalDay.setHours(23, 59, 59, 999);

    // Cap the daily chart to not exceed 31 days to avoid rendering issues
    while (currentDay <= finalDay && days.length < 31) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Query status change histories for tasks in this sprint to find when they were marked 'done'
    const taskIds = tasks.map(t => t._id);
    const histories = await TaskHistory.find({
      task: { $in: taskIds },
      field: 'status',
      newValue: 'done'
    }).sort({ createdAt: 1 });

    // Build map of taskId -> completionDate
    const completionDates = new Map<string, Date>();
    histories.forEach(h => {
      // Keep the earliest time it was marked 'done'
      const taskIdStr = h.task.toString();
      if (!completionDates.has(taskIdStr)) {
        completionDates.set(taskIdStr, h.createdAt);
      }
    });

    // Fallback: If task is currently 'done' but has no history, use updatedAt
    tasks.forEach(t => {
      if (t.status === 'done') {
        const taskIdStr = t._id.toString();
        if (!completionDates.has(taskIdStr)) {
          completionDates.set(taskIdStr, (t as any).updatedAt || new Date());
        }
      }
    });

    // Calculate remaining points and tasks for each day
    const burndownData = days.map((day, index) => {
      day.setHours(23, 59, 59, 999); // End of day check

      let completedPoints = 0;
      tasks.forEach(t => {
        const completionDate = completionDates.get(t._id.toString());
        if (completionDate && completionDate <= day) {
          completedPoints += t.storyPoints || 1;
        }
      });

      const remainingPoints = Math.max(0, totalPoints - completedPoints);

      // Calculate ideal burndown line: linear from totalPoints on Day 0 to 0 on final day
      const idealPoints = days.length > 1 
        ? Math.max(0, totalPoints - (totalPoints / (days.length - 1)) * index)
        : 0;

      const dateStr = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return {
        day: `Day ${index + 1} (${dateStr})`,
        remainingPoints: Math.round(remainingPoints * 10) / 10,
        idealPoints: Math.round(idealPoints * 10) / 10
      };
    });

    res.status(200).json({
      success: true,
      data: burndownData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Project Velocity Chart Data
 * @route   GET /api/reports/projects/:projectId/velocity
 * @access  Private
 */
export const getProjectVelocity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    await validateProjectMembership(projectId as string, req.user!._id.toString(), req.user!.role);

    // Fetch all sprints in this project (active or completed, sorted by creation)
    const sprints = await Sprint.find({ 
      projectId: new mongoose.Types.ObjectId(projectId as string),
      status: { $in: ['active', 'completed'] }
    }).sort({ createdAt: 1 });

    const velocityData = await Promise.all(
      sprints.map(async sprint => {
        // Find all tasks associated with this sprint
        const tasks = await Task.find({ sprintId: sprint._id });

        let plannedPoints = 0;
        let completedPoints = 0;

        tasks.forEach(t => {
          const points = t.storyPoints || 1;
          plannedPoints += points;
          if (t.status === 'done') {
            completedPoints += points;
          }
        });

        return {
          sprintName: sprint.name,
          planned: plannedPoints,
          completed: completedPoints
        };
      })
    );

    res.status(200).json({
      success: true,
      data: velocityData
    });
  } catch (error) {
    next(error);
  }
};
