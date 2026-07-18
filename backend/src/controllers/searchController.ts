import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import OrganizationMember from '../models/OrganizationMember.js';
import { BadRequestError } from '../middleware/errorMiddleware.js';

/**
 * @desc    Global Search across projects, tasks, and members in organization
 * @route   GET /api/search
 * @access  Private
 */
export const globalSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    if (!q || typeof q !== 'string' || !q.trim()) {
      res.status(200).json({
        success: true,
        data: {
          projects: [],
          tasks: [],
          users: []
        }
      });
      return;
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // 1. Search projects
    const projects = await Project.find({
      organization: new mongoose.Types.ObjectId(orgId.toString()),
      isArchived: false,
      $or: [
        { name: searchRegex },
        { key: searchRegex },
        { description: searchRegex }
      ]
    }).limit(10);

    // 2. Search tasks
    const tasks = await Task.find({
      organization: new mongoose.Types.ObjectId(orgId.toString()),
      $or: [
        { title: searchRegex },
        { taskKey: searchRegex },
        { description: searchRegex }
      ]
    })
    .populate('project', 'name key')
    .populate('assignedTo', 'name email avatar')
    .limit(10);

    // 3. Search users (within organization)
    const orgMembers = await OrganizationMember.find({
      organization: new mongoose.Types.ObjectId(orgId.toString()),
      status: 'active'
    }).populate({
      path: 'user',
      select: 'name email avatar firstName lastName username'
    });

    const matchedUsers: any[] = [];
    orgMembers.forEach((member: any) => {
      const u = member.user;
      if (!u) return;

      const fullName = `${u.firstName || ''} ${u.lastName || ''} ${u.name || ''}`;
      if (
        fullName.match(searchRegex) ||
        u.email.match(searchRegex) ||
        (u.username && u.username.match(searchRegex))
      ) {
        matchedUsers.push(u);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        projects,
        tasks,
        users: matchedUsers.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};
