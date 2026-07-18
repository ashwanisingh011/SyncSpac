import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Team from '../models/Team.js';
import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware.js';

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private (manage_team permission)
 */
export const createTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, lead, members, projectIds } = req.body;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    if (!name) {
      throw new BadRequestError('Team name is required');
    }

    const team = new Team({
      orgId,
      name,
      description,
      lead: lead ? new mongoose.Types.ObjectId(lead) : undefined,
      members: members ? members.map((m: string) => new mongoose.Types.ObjectId(m)) : [],
      projectIds: projectIds ? projectIds.map((p: string) => new mongoose.Types.ObjectId(p)) : [],
      createdBy: req.user?._id,
    });

    await team.save();

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all teams in the active organization
 * @route   GET /api/teams
 * @access  Private
 */
export const getTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    const teams = await Team.find({ orgId })
      .populate('lead', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('projectIds', 'name key description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single team detail
 * @route   GET /api/teams/:id
 * @access  Private
 */
export const getTeamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;

    const team = await Team.findOne({ _id: id, orgId })
      .populate('lead', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('projectIds', 'name key description');

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update team details
 * @route   PATCH /api/teams/:id
 * @access  Private (manage_team permission)
 */
export const updateTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;
    const { name, description, lead, members, projectIds } = req.body;

    const team = await Team.findOne({ _id: id, orgId });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (lead !== undefined) team.lead = lead ? new mongoose.Types.ObjectId(lead) : undefined;
    if (members) team.members = members.map((m: string) => new mongoose.Types.ObjectId(m));
    if (projectIds) team.projectIds = projectIds.map((p: string) => new mongoose.Types.ObjectId(p));

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a team
 * @route   DELETE /api/teams/:id
 * @access  Private (manage_team permission)
 */
export const deleteTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;

    const team = await Team.findOneAndDelete({ _id: id, orgId });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add member to team
 * @route   POST /api/teams/:id/members
 * @access  Private (manage_team permission)
 */
export const addTeamMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const orgId = req.user?.organization;

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const team = await Team.findOne({ _id: id, orgId });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const memberId = new mongoose.Types.ObjectId(userId);
    if (team.members.some(m => m.equals(memberId))) {
      throw new BadRequestError('User is already a member of this team');
    }

    team.members.push(memberId);
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member added to team successfully',
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Private (manage_team permission)
 */
export const removeTeamMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const orgId = req.user?.organization;

    const team = await Team.findOne({ _id: id, orgId });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const memberId = new mongoose.Types.ObjectId(userId as string);
    const initialLength = team.members.length;
    team.members = team.members.filter(m => !m.equals(memberId));

    if (team.members.length === initialLength) {
      throw new BadRequestError('User is not a member of this team');
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member removed from team successfully',
      data: team,
    });
  } catch (error) {
    next(error);
  }
};
