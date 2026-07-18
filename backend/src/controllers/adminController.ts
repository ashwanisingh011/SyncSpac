import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import OrganizationMember from '../models/OrganizationMember.js';
import AuditLog from '../models/AuditLog.js';
import { UserRole } from '../types/roles.js';
import { BadRequestError, NotFoundError } from '../middleware/errorMiddleware.js';
import { getPlatformRoleLabel } from '../utils/roleCatalog.js';
import { emailQueue, queueInitialized } from '../config/queue.js';

/**
 * @desc    Fetch all Organization Admins and Members, excluding Super Admins (with search & filter)
 * @route   GET /api/admin/platform-users
 * @access  Private (Super Admin Only)
 */
export const getPlatformUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, isActive, organization } = req.query;
    const filter: any = { role: { $ne: UserRole.SUPER_ADMIN } };

    if (role) {
      filter.role = role;
    }
    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    const searchStr = typeof search === 'string' ? search.trim() : '';
    const searchConditions = searchStr ? [
      { name: { $regex: searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { email: { $regex: searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { username: { $regex: searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    ] : null;

    let isOrgFilterApplied = false;
    if (organization) {
      isOrgFilterApplied = true;
      if (organization === 'no_workspace') {
        const allMembers = await OrganizationMember.find().select('user');
        const allMemberUserIds = allMembers.map(m => m.user);
        const noOrgFilter = {
          $and: [
            {
              $or: [
                { organization: { $exists: false } },
                { organization: null }
              ]
            },
            { _id: { $nin: allMemberUserIds } }
          ]
        };

        if (searchConditions) {
          filter.$and = [
            { $or: searchConditions },
            noOrgFilter
          ];
        } else {
          filter.organization = { $exists: false };
          filter._id = { $nin: allMemberUserIds };
        }
      } else {
        const members = await OrganizationMember.find({ organization }).select('user');
        const orgUserIds = members.map(m => m.user);
        const orgFilter = {
          $or: [
            { organization: organization },
            { organizations: organization },
            { _id: { $in: orgUserIds } }
          ]
        };

        if (searchConditions) {
          filter.$and = [
            { $or: searchConditions },
            orgFilter
          ];
        } else {
          filter.$or = orgFilter.$or;
        }
      }
    } else if (searchConditions) {
      filter.$or = searchConditions;
    }

    const users = await User.find(filter).select('name email role isActive createdAt avatar organization');

    const platformUsers = await Promise.all(
      users.map(async (user) => {
        // Find user's organization if any
        let orgName = 'No Workspace';
        let orgId = '';
        if (user.organization) {
          const org = await Organization.findById(user.organization).select('name');
          if (org) {
            orgName = org.name;
            orgId = org._id.toString();
          }
        } else {
          // Fallback check org members
          const memberRecord = await OrganizationMember.findOne({ user: user._id })
            .populate('organization', 'name')
            .lean();
          if (memberRecord && (memberRecord as any).organization) {
            orgName = (memberRecord as any).organization.name;
            orgId = (memberRecord as any).organization._id.toString();
          }
        }

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          role: user.role,
          roleLabel: await getPlatformRoleLabel(user.role),
          status: user.isActive ? 'active' : 'inactive',
          orgName,
          orgId,
          createdAt: (user as any).createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Platform users retrieved successfully',
      data: platformUsers,
    });
  } catch (error: any) {
    console.error('Error in getPlatformUsers:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Toggle Ban/Active status for a platform user
 * @route   PATCH /api/admin/users/:userId/toggle-ban
 * @access  Private (Super Admin Only)
 */
export const toggleBanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestError('Cannot ban a Super Administrator');
    }

    user.isActive = !user.isActive;
    await user.save();

    // Log to AuditLog
    await AuditLog.create({
      performedBy: (req as any).user._id,
      action: user.isActive ? 'unban_user' : 'ban_user',
      targetUserId: user._id,
      reason: reason || `User ${user.isActive ? 'activated' : 'banned'} by superadmin.`,
      meta: { ip: req.ip },
    });

    res.status(200).json({
      success: true,
      message: `User is now ${user.isActive ? 'activated' : 'banned'}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive',
      },
    });
  } catch (error: any) {
    console.error('Error in toggleBanUser:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * @desc    Get all organizations in the platform (with search & filters)
 * @route   GET /api/admin/organizations
 * @access  Private (Super Admin Only)
 */
export const getPlatformOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, plan, status } = req.query;
    const filter: any = { isDeleted: false };

    if (plan) {
      filter.plan = plan;
    }
    if (status) {
      filter.subscriptionStatus = status;
    }
    const searchStr = typeof search === 'string' ? search.trim() : '';
    if (searchStr) {
      const escapedSearch = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { slug: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const orgs = await Organization.find(filter).populate('owner', 'name email');

    const orgsWithMetrics = await Promise.all(
      orgs.map(async (org) => {
        const usersCount = await OrganizationMember.countDocuments({ organization: org._id });
        const projectsCount = await Project.countDocuments({ organization: org._id });

        return {
          id: org._id,
          name: org.name,
          slug: org.slug,
          owner: org.owner ? (org.owner as any).name : 'Unknown Owner',
          plan: org.plan || 'free',
          status: org.subscriptionStatus || 'trial',
          users: usersCount,
          projects: projectsCount,
          createdAt: (org as any).createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: orgsWithMetrics,
    });
  } catch (error: any) {
    console.error('Error in getPlatformOrganizations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Toggle Suspension status of an organization
 * @route   PATCH /api/admin/organizations/:orgId/toggle-suspend
 * @access  Private (Super Admin Only)
 */
export const toggleSuspendOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { reason } = req.body;

    const org = await Organization.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const oldStatus = org.subscriptionStatus;
    if (org.subscriptionStatus === 'suspended') {
      org.subscriptionStatus = 'active';
    } else {
      org.subscriptionStatus = 'suspended';
    }

    await org.save();

    // Log to AuditLog
    await AuditLog.create({
      performedBy: (req as any).user._id,
      action: org.subscriptionStatus === 'active' ? 'activate_org' : 'suspend_org',
      targetOrgId: org._id,
      reason: reason || `Organization status updated from ${oldStatus} to ${org.subscriptionStatus}.`,
      meta: { ip: req.ip },
    });

    res.status(200).json({
      success: true,
      message: `Organization subscription is now ${org.subscriptionStatus}`,
      data: {
        id: org._id,
        name: org.name,
        status: org.subscriptionStatus,
      },
    });
  } catch (error: any) {
    console.error('Error in toggleSuspendOrganization:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * @desc    Change subscription plan for organization
 * @route   PATCH /api/admin/organizations/:orgId/plan
 * @access  Private (Super Admin Only)
 */
export const changeOrganizationPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orgId } = req.params;
    const { plan, reason } = req.body;

    if (!plan || !['free', 'pro', 'business', 'enterprise'].includes(plan)) {
      throw new BadRequestError('Invalid plan specified');
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const oldPlan = org.plan;
    org.plan = plan;
    await org.save();

    // Log to AuditLog
    await AuditLog.create({
      performedBy: (req as any).user._id,
      action: 'change_plan',
      targetOrgId: org._id,
      reason: reason || `Subscription tier modified from ${oldPlan} to ${plan}.`,
      meta: { oldPlan, newPlan: plan, ip: req.ip },
    });

    res.status(200).json({
      success: true,
      message: `Organization plan changed to ${plan}`,
      data: {
        id: org._id,
        name: org.name,
        plan: org.plan,
      },
    });
  } catch (error: any) {
    console.error('Error in changeOrganizationPlan:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * @desc    Get Platform-Wide Statistics (Refactored to map 6 KPIs)
 * @route   GET /api/admin/stats
 * @access  Private (Super Admin Only)
 */
export const getPlatformStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const orgsCount = await Organization.countDocuments({ isDeleted: false });
    const usersCount = await User.countDocuments();
    const projectsCount = await Project.countDocuments({ isArchived: false });
    const tasksCount = await Task.countDocuments();

    // 1. Total Users
    const totalUsers = usersCount;

    // 2. Active Orgs
    const activeOrgs = await Organization.countDocuments({
      subscriptionStatus: { $ne: 'suspended' },
      isDeleted: false,
    });

    // 3. Tasks Created Today
    const tasksToday = await Task.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // 4. Active Sprints
    const activeSprints = await Sprint.countDocuments({
      status: 'active',
    });

    // 5. Flagged Issues (Tasks with high priority or blocked status)
    const flaggedIssues = await Task.countDocuments({
      $or: [{ priority: 'high' }, { status: 'blocked' }],
    });

    // 6. Revenue MRR calculation
    const freeOrgs = await Organization.countDocuments({ plan: 'free', subscriptionStatus: { $ne: 'suspended' }, isDeleted: false });
    const proOrgs = await Organization.countDocuments({ plan: 'pro', subscriptionStatus: { $ne: 'suspended' }, isDeleted: false });
    const bizOrgs = await Organization.countDocuments({ plan: 'business', subscriptionStatus: { $ne: 'suspended' }, isDeleted: false });
    const entOrgs = await Organization.countDocuments({ plan: 'enterprise', subscriptionStatus: { $ne: 'suspended' }, isDeleted: false });
    const revenueMRR = (proOrgs * 49) + (bizOrgs * 99) + (entOrgs * 299);

    const activeSubs = proOrgs + bizOrgs + entOrgs;

    res.status(200).json({
      success: true,
      data: {
        orgsCount,
        usersCount,
        projectsCount,
        tasksCount,
        activeSubs,
        monthlyRevenue: revenueMRR,

        // New KPI bindings
        totalUsers,
        activeOrgs,
        tasksToday,
        activeSprints,
        flaggedIssues,
        revenueMRR,

        // Plan distribution
        planDistribution: {
          free: freeOrgs,
          pro: proOrgs,
          business: bizOrgs,
          enterprise: entOrgs
        }
      },
    });
  } catch (error: any) {
    console.error('Error in getPlatformStats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get Platform-Wide Recent Audit Logs (Filtered & Paginated)
 * @route   GET /api/admin/audit-logs
 * @access  Private (Super Admin Only)
 */
export const getPlatformAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, from, to, search } = req.query;
    const filter: any = {};

    if (action) {
      filter.action = action;
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from as string);
      if (to) filter.createdAt.$lte = new Date(to as string);
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email avatar')
      .populate('targetUserId', 'name email')
      .populate('targetOrgId', 'name slug');

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('Error in getPlatformAuditLogs:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get Daily User Registration Growth (Last 30 days)
 * @route   GET /api/admin/user-growth
 * @access  Private (Super Admin Only)
 */
export const getUserGrowth = async (req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const signups = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const growthData = [];
    const dateMap = new Map(signups.map((s) => [s._id, s.count]));

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const count = dateMap.get(key) || 0;

      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      growthData.push({ month: label, signups: count });
    }

    res.status(200).json({
      success: true,
      data: growthData,
    });
  } catch (error) {
    console.error('Error in getUserGrowth:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get Live Server Health & Latency Metrics
 * @route   GET /api/admin/system/health
 * @access  Private (Super Admin Only)
 */
export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Uptime
    const uptimeSecs = process.uptime();
    const days = Math.floor(uptimeSecs / (3600 * 24));
    const hours = Math.floor((uptimeSecs % (3600 * 24)) / 3600);
    const mins = Math.floor((uptimeSecs % 3600) / 60);
    const uptime = `${days}d ${hours}h ${mins}m`;

    // 2. Database latency check
    const start = Date.now();
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    await mongoose.connection.db.admin().ping();
    const dbLatency = `${Date.now() - start}ms`;

    // 3. Queue status
    let bullJobsCount = { waiting: 0, active: 0, completed: 0, failed: 0 };
    if (queueInitialized && emailQueue) {
      try {
        const counts = await emailQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
        bullJobsCount = {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
        };
      } catch (err) {
        console.warn('Failed to fetch job counts:', err);
      }
    }

    // 4. Memory usage
    const mem = process.memoryUsage();
    const memory = {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
    };

    res.status(200).json({
      success: true,
      data: {
        uptime,
        dbLatency,
        bullJobsCount,
        memory,
      },
    });
  } catch (error) {
    console.error('Error in getSystemHealth:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Direct Organization Creation by Superadmin
 * @route   POST /api/admin/organizations
 * @access  Private (Super Admin Only)
 */
export const createOrganizationByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, ownerEmail, plan } = req.body;

    if (!name || !ownerEmail) {
      throw new BadRequestError('Organization name and owner email are required');
    }

    // Resolve owner
    const owner = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (!owner) {
      throw new NotFoundError(`User with email ${ownerEmail} not found. Register them first.`);
    }

    // Create organization
    const org = new Organization({
      name,
      owner: owner._id,
      plan: plan || 'free',
      subscriptionStatus: 'active',
    });

    await org.save();

    // Bind owner as ORG_ADMIN in orgmembers
    await OrganizationMember.create({
      organization: org._id,
      userId: owner._id,
      role: UserRole.ORG_ADMIN,
      status: 'active',
    });

    // Update user's currentOrgId if not set
    if (!owner.organization) {
      owner.organization = org._id as mongoose.Types.ObjectId;
      if (!owner.organizations) owner.organizations = [];
      owner.organizations.push(org._id as mongoose.Types.ObjectId);
      await owner.save();
    }

    // Log to AuditLog
    await AuditLog.create({
      performedBy: (req as any).user._id,
      action: 'seed_superadmin', // reusing seed action code as general creation
      targetOrgId: org._id,
      reason: `Organization ${org.name} created directly by superadmin with owner ${owner.email}.`,
      meta: { ownerId: owner._id, plan: org.plan },
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        id: org._id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        owner: owner.name,
      },
    });
  } catch (error: any) {
    console.error('Error in createOrganizationByAdmin:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
