import { Types } from 'mongoose';
import Organization from '../models/Organization.js';
import Plan from '../models/Plan.js';
import OrganizationMember from '../models/OrganizationMember.js';
import Project from '../models/Project.js';
import File from '../models/File.js';
import Task from '../models/Task.js';
import TaskAttachment from '../models/TaskAttachment.js';
import Role from '../models/Role.js';
import sendEmail from './sendEmail.js';
import { buildLimitExceededEmail } from './emailTemplate.js';


export interface SubscriptionStatus {
  orgId: string;
  orgName: string;
  planCode: string;
  planName: string;
  limits: {
    users: number;      // -1 for unlimited
    projects: number;   // -1 for unlimited
    storage: number;    // GB, -1 for unlimited
    customRoles: boolean;
    analytics: boolean;
    prioritySupport: boolean;
  };
  usage: {
    users: number;
    projects: number;
    storageBytes: number;
    storageGB: number;
    customRoles: number;
  };
  exceeded: {
    users: boolean;
    projects: boolean;
    storage: boolean;
    customRoles: boolean;
  };
  anyExceeded: boolean;
}

export const getOrgSubscriptionStatus = async (orgId: string | Types.ObjectId): Promise<SubscriptionStatus> => {
  if (!orgId || !Types.ObjectId.isValid(orgId.toString())) {
    throw new Error('Invalid Organization ID');
  }
  const org = await Organization.findById(orgId);
  if (!org) {
    throw new Error('Organization not found');
  }

  // Find plan by organization's plan (case-insensitive)
  const planCode = (org.plan || 'free').toUpperCase();
  let plan = await Plan.findOne({ code: planCode });

  // Fallback to FREE plan if not found
  if (!plan) {
    plan = await Plan.findOne({ code: 'FREE' });
  }

  if (!plan) {
    // Hardcoded absolute fallback if database is empty of plans
    plan = new Plan({
      name: 'Free',
      code: 'FREE',
      description: 'Free Plan',
      billingCycle: 'monthly',
      price: 0,
      features: [
        { label: 'Custom roles', included: false },
        { label: 'Advanced analytics', included: false },
        { label: 'Priority support', included: false },
      ],
      limits: {
        users: 5,
        projects: 3,
        storage: 2,
        apiCalls: 10000,
      },
    });
  }

  // Count active members (OrganizationMember status must be active)
  const activeMembersCount = await OrganizationMember.countDocuments({
    organization: org._id,
    status: 'active',
  });

  // Count projects (excluding archived projects)
  const projectsCount = await Project.countDocuments({
    organization: org._id,
    isArchived: false,
  });

  // Calculate storage usage (sum of all File sizes and TaskAttachment sizes)
  const projectDocs = await Project.find({ organization: org._id }).select('_id');
  const projectIds = projectDocs.map((p) => p._id);

  const fileStorageAgg = await File.aggregate([
    { $match: { orgId: new Types.ObjectId(org._id.toString()), isFolder: false } },
    { $group: { _id: null, total: { $sum: '$fileSize' } } },
  ]);
  const fileStorage = fileStorageAgg[0]?.total || 0;

  let attachmentStorage = 0;
  if (projectIds.length > 0) {
    const taskDocs = await Task.find({ project: { $in: projectIds } }).select('_id');
    const taskIds = taskDocs.map((t) => t._id);
    if (taskIds.length > 0) {
      const attachmentStorageAgg = await TaskAttachment.aggregate([
        { $match: { task: { $in: taskIds } } },
        { $group: { _id: null, total: { $sum: '$fileSize' } } },
      ]);
      attachmentStorage = attachmentStorageAgg[0]?.total || 0;
    }
  }

  const totalStorageBytes = fileStorage + attachmentStorage;
  const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);

  // Helper to dynamically resolve features by label name normalization
  const hasFeature = (labelSearch: string): boolean => {
    const normalizedSearch = labelSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (plan?.features || []).some((f) => {
      const normalizedLabel = (f.label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedLabel.includes(normalizedSearch) && f.included;
    });
  };


  const customRolesAllowed = hasFeature('customroles');
  const analyticsAllowed = hasFeature('analytics');
  const prioritySupportAllowed = hasFeature('support');

  // Count custom roles created for this organization
  const customRolesCount = await Role.countDocuments({
    orgId: org._id,
    isDefault: false,
  });

  // Determine limit exceedance states
  const usersLimit = plan.limits.users;
  const projectsLimit = plan.limits.projects;
  const storageLimitGB = plan.limits.storage;

  const usersExceeded = usersLimit !== -1 && activeMembersCount > usersLimit;
  const projectsExceeded = projectsLimit !== -1 && projectsCount > projectsLimit;
  const storageExceeded = storageLimitGB !== -1 && totalStorageGB > storageLimitGB;
  const customRolesExceeded = !customRolesAllowed && customRolesCount > 0;

  const anyExceeded = usersExceeded || projectsExceeded || storageExceeded || customRolesExceeded;

  return {
    orgId: String(org._id),
    orgName: org.name,
    planCode: plan.code,
    planName: plan.name,
    limits: {
      users: usersLimit,
      projects: projectsLimit,
      storage: storageLimitGB,
      customRoles: customRolesAllowed,
      analytics: analyticsAllowed,
      prioritySupport: prioritySupportAllowed,
    },
    usage: {
      users: activeMembersCount,
      projects: projectsCount,
      storageBytes: totalStorageBytes,
      storageGB: parseFloat(totalStorageGB.toFixed(4)),
      customRoles: customRolesCount,
    },
    exceeded: {
      users: usersExceeded,
      projects: projectsExceeded,
      storage: storageExceeded,
      customRoles: customRolesExceeded,
    },
    anyExceeded,
  };
};

export const sendLimitExceededEmail = async (
  orgId: string | Types.ObjectId,
  featureName: string,
  currentUsage: string,
  allowedLimit: string
): Promise<void> => {
  try {
    const org = await Organization.findById(orgId).populate('owner');
    if (!org || !org.owner) return;
    const ownerUser = org.owner as any;
    if (!ownerUser.email) return;

    const planCode = (org.plan || 'free').toUpperCase();
    const plan = await Plan.findOne({ code: planCode }) || { name: planCode };
    const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`;

    const { message, html } = buildLimitExceededEmail(
      plan.name || planCode,
      featureName,
      currentUsage,
      allowedLimit,
      billingUrl
    );

    await sendEmail({
      email: ownerUser.email,
      subject: `TaskBridge Alert: Subscription Limit Exceeded - ${featureName}`,
      message,
      html,
    });
  } catch (error) {
    console.error('Failed to send limit exceeded email:', error);
  }
};

