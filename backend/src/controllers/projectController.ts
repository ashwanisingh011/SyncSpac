import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Project, { ProjectType, ProjectVisibilty } from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import ProjectStatus from '../models/ProjectStatus.js';
import Organization from '../models/Organization.js';
import OrganizationMember, { OrgRole } from '../models/OrganizationMember.js';
import WorkspaceSettings from '../models/WorkspaceSettings.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { UserRole } from '../types/roles.js';
import { isSuperAdminRole, normalizeRoleCode, hasPermissionAccess } from '../utils/rbacMatrix.js';

const getOrganizationId = (req: Request): Types.ObjectId | undefined => {
    return req.user?.organization ? new Types.ObjectId(req.user.organization.toString()) : undefined;
};

const hasProjectCreateAccess = async (organizationId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> => {
    const user = await User.findById(userId).select('role');
    if (user && (isSuperAdminRole(user.role) || hasPermissionAccess(user.role, 'create_project'))) {
        return true;
    }

    const organization = await Organization.findOne({
        _id: organizationId,
        owner: userId
    }).select('_id');

    if (organization) {
        return true;
    }

    const member = await OrganizationMember.findOne({
        organization: organizationId,
        user: userId,
        status: 'active',
        role: { $in: [OrgRole.OWNER, OrgRole.ADMIN] }
    }).select('_id');

    return Boolean(member);
};

const hasOrganizationProjectAdminAccess = async (
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
    role?: string
): Promise<boolean> => {
    const normalizedRole = normalizeRoleCode(role);
    if (isSuperAdminRole(role) || normalizedRole === 'org_admin') {
        return true;
    }

    const organization = await Organization.findOne({
        _id: organizationId,
        owner: userId
    }).select('_id');

    return Boolean(organization);
};

const isValidObjectId = (value: unknown): boolean => typeof value === 'string' && Types.ObjectId.isValid(value);

const createDefaultStatuses = async (projectId: Types.ObjectId, organizationId: Types.ObjectId): Promise<void> => {
    await ProjectStatus.insertMany([
        { name: 'To Do', color: '#cbd5e0', order: 1, project: projectId, organization: organizationId },
        { name: 'In Progress', color: '#3182ce', order: 2, project: projectId, organization: organizationId },
        { name: 'Completed', color: '#38a169', order: 3, project: projectId, organization: organizationId }
    ]);
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : undefined;

        if (!organizationId || !requesterId) {
            res.status(403).json({ success: false, message: 'Organization not found' });
            return;
        }
        
        const globalSettings = await WorkspaceSettings.findOne({ organization: organizationId });
        
        const allowedLayouts = ['kanban', 'list', 'calendar', 'timeline'];
        if (req.body.defaultLayout && !allowedLayouts.includes(req.body.defaultLayout)) {
            res.status(400).json({ success: false, message: 'Invalid default layout' });
            return;
        }
        const selectedLayout = req.body.defaultLayout || globalSettings?.defaultLayout || 'kanban';

        const canCreateProject = await hasProjectCreateAccess(organizationId, requesterId);
        if (!canCreateProject) {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
            return;
        }

        const {
            name,
            key,
            description = '',
            logo = '',
            projectType = ProjectType.SOFTWARE,
            visibility = ProjectVisibilty.PRIVATE
        } = req.body;

        if (!name || !key) {
            res.status(400).json({ success: false, message: 'Project name and key are required' });
            return;
        }

        const project = await Project.create({
            name,
            key,
            description,
            logo,
            projectType,
            visibility,
            organization: organizationId,
            owner: requesterId,
            defaultLayout: selectedLayout
        });

        await createDefaultStatuses(project._id, organizationId);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000) {
            res.status(409).json({ success: false, message: 'A project with this name or key already exists' });
            return;
        }

        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const userRole = req.user?.role;

        if (!userId) {
            res.status(403).json({ success: false, message: 'User not found' });
            return;
        }

        const includeArchived = req.query.archived === 'true';
        let queryCondition: any = {};

        if (req.query.allOrganizations === 'true') {
            // Find all active organizations where this user has the role 'client'
            const memberships = await OrganizationMember.find({
                user: userId,
                status: 'active',
                role: 'client'
            });
            const orgIds = memberships.map(m => m.organization);

            const assignedMemberships = await ProjectMember.find({ user: userId, organization: { $in: orgIds } }).select('project');
            const projectIds = assignedMemberships.map(m => m.project);

            const tasksAssignedToUser = await Task.find({ assignedTo: userId, organization: { $in: orgIds } }).select('project');
            const assignedProjectIdsFromTasks = tasksAssignedToUser.map(t => t.project);

            queryCondition = {
                organization: { $in: orgIds },
                ...(includeArchived ? {} : { isArchived: false }),
                $or: [
                    { owner: userId },
                    { _id: { $in: [...projectIds, ...assignedProjectIdsFromTasks] } }
                ]
            };
        } else {
            const organizationId = getOrganizationId(req);
            if (!organizationId) {
                res.status(403).json({ success: false, message: 'Organization not found' });
                return;
            }

            queryCondition = {
                organization: organizationId,
                ...(includeArchived ? {} : { isArchived: false })
            };

            const canSeeAllProjects = await hasOrganizationProjectAdminAccess(
                organizationId,
                new Types.ObjectId(userId.toString()),
                userRole
            );

            if (!canSeeAllProjects) {
                const assignedMemberships = await ProjectMember.find({ user: userId, organization: organizationId }).select('project');
                const projectIds = assignedMemberships.map(m => m.project);

                const tasksAssignedToUser = await Task.find({ assignedTo: userId, organization: organizationId }).select('project');
                const assignedProjectIdsFromTasks = tasksAssignedToUser.map(t => t.project);

                queryCondition.$or = [
                    { owner: userId },
                    { _id: { $in: [...projectIds, ...assignedProjectIdsFromTasks] } }
                ];
            }
        }

        const projects = await Project.find(queryCondition).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Projects fetched successfully',
            data: projects
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const { projectId } = req.params;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found' });
            return;
        }

        if (!isValidObjectId(projectId)) {
            res.status(400).json({ success: false, message: 'Invalid project ID' });
            return;
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: organizationId
        });

        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Project fetched successfully',
            data: project
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};

export const getProjectMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const { projectId } = req.params;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found', data: null });
            return;
        }

        if (!isValidObjectId(projectId)) {
            res.status(400).json({ success: false, message: 'Invalid project ID', data: null });
            return;
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: organizationId
        }).select('_id owner');

        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found', data: null });
            return;
        }

        const [projectAssignments, assignedTasks] = await Promise.all([
            ProjectMember.find({ project: project._id, organization: organizationId }).select('user role'),
            Task.find({
                project: project._id,
                organization: organizationId,
                assignedTo: { $ne: null }
            }).select('assignedTo')
        ]);

        const assignedTaskCounts = new Map<string, number>();
        const projectUserIds = new Set<string>([project.owner.toString()]);
        const projectRoles = new Map<string, string>();

        projectAssignments.forEach((assignment) => {
            const userId = assignment.user.toString();
            projectUserIds.add(userId);
            projectRoles.set(userId, assignment.role);
        });

        assignedTasks.forEach((task) => {
            if (!task.assignedTo) return;
            const userId = task.assignedTo.toString();
            projectUserIds.add(userId);
            assignedTaskCounts.set(userId, (assignedTaskCounts.get(userId) ?? 0) + 1);
        });

        const userIds = Array.from(projectUserIds);
        const [users, organizationMembers] = await Promise.all([
            User.find({
                _id: { $in: userIds },
                isActive: true
            }).select('name email username avatar role'),
            OrganizationMember.find({
                organization: organizationId,
                user: { $in: userIds }
            }).select('user role status joinedAt createdAt')
        ]);

        const organizationMemberByUserId = new Map(
            organizationMembers.map((member) => [member.user.toString(), member])
        );

        const members = users
            .map((user) => {
                const userId = user._id.toString();
                const organizationMember = organizationMemberByUserId.get(userId);
                const joinedAt = organizationMember?.joinedAt
                    ?? (organizationMember as { createdAt?: Date } | undefined)?.createdAt
                    ?? (user as { createdAt?: Date }).createdAt
                    ?? new Date();

                return {
                    id: organizationMember?._id.toString() ?? userId,
                    userId,
                    workspaceId: organizationId.toString(),
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    avatarUrl: user.avatar,
                    role: userId === project.owner.toString()
                        ? OrgRole.OWNER
                        : organizationMember?.role ?? user.role ?? projectRoles.get(userId),
                    roleName: userId === project.owner.toString()
                        ? 'Owner'
                        : undefined,
                    projectRole: userId === project.owner.toString()
                        ? 'project_manager'
                        : projectRoles.get(userId),
                    joinedAt: joinedAt.toISOString(),
                    status: organizationMember?.status ?? 'active',
                    assignedTaskCount: assignedTaskCounts.get(userId) ?? 0
                };
            })
            .filter((member) => member.status === 'active');

        res.status(200).json({
            success: true,
            message: 'Project members fetched successfully',
            data: members
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const { projectId } = req.params;
        const userId = req.user?._id;
        const userRole = req.user?.role;

        if (!organizationId || !userId) {
            res.status(403).json({ success: false, message: 'Organization or User not found' });
            return;
        }

        if (!isValidObjectId(projectId)) {
            res.status(400).json({ success: false, message: 'Invalid project ID' });
            return;
        }
        
        const project = await Project.findOne({_id: projectId, organization: organizationId })

        if(!project){
            res.status(404).json({success: false, message: "Project not found"});
            return
        }

        const canManageAllProjects = await hasOrganizationProjectAdminAccess(
            organizationId,
            new Types.ObjectId(userId.toString()),
            userRole
        );

        if(!canManageAllProjects){
            if(normalizeRoleCode(userRole) === UserRole.PROJECT_MANAGER){
                // PMs can manage any project within the organization
            }else{
                res.status(403).json({success: false, message: "Forbidden: Insufficient permissions"})
                return
            }
        }

        const updatedProject = await Project.findOneAndUpdate(
            {
                _id: projectId,
                organization: organizationId
            },
            {
                $set: {
                    ...(req.body.name !== undefined ? { name: req.body.name } : {}),
                    ...(req.body.key !== undefined ? { key: req.body.key } : {}),
                    ...(req.body.description !== undefined ? { description: req.body.description } : {}),
                    ...(req.body.logo !== undefined ? { logo: req.body.logo } : {}),
                    ...(req.body.projectType !== undefined ? { projectType: req.body.projectType } : {}),
                    ...(req.body.visibility !== undefined ? { visibility: req.body.visibility } : {}),
                    ...(req.body.status !== undefined ? { status: req.body.status } : {})
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedProject) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: updatedProject
        });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000) {
            res.status(409).json({ success: false, message: 'A project with this name or key already exists' });
            return;
        }

        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};

export const archiveProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const { projectId } = req.params;
        const userId = req.user?._id;
        const userRole = req.user?.role;

        if (!organizationId || !userId) {
            res.status(403).json({ success: false, message: 'Organization or User not found' });
            return;
        }

        if (!isValidObjectId(projectId)) {
            res.status(400).json({ success: false, message: 'Invalid project ID' });
            return;
        }

        const project = await Project.findOne({_id: projectId, organization: organizationId})

        if(!project){
            res.status(404).json({success: false, message: "Project not found"})
            return
        }

        const canManageAllProjects = await hasOrganizationProjectAdminAccess(
            organizationId,
            new Types.ObjectId(userId.toString()),
            userRole
        );

        if(!canManageAllProjects){
            if(normalizeRoleCode(userRole) === UserRole.PROJECT_MANAGER){
                // PMs can manage any project within the organization
            }else{
                res.status(403).json({success: false, message: "Forbidden: Insufficient permissions"})
                return
            }
        }

        project.isArchived = true;
        await project.save();

        res.status(200).json({
            success: true,
            message: 'Project archived successfully',
            data: project
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};

export const assignUserToProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const { projectId } = req.params;
        const { userId, role } = req.body;
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : undefined;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found' });
            return;
        }

        if (!userId || !role) {
            res.status(400).json({ success: false, message: 'User ID and role are required' });
            return;
        }

        if (!isValidObjectId(projectId) || !isValidObjectId(userId)) {
            res.status(400).json({ success: false, message: 'Invalid project ID or user ID' });
            return;
        }

        if (!Object.values(UserRole).includes(role)) {
            res.status(400).json({ success: false, message: 'Invalid role' });
            return;
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: organizationId
        }).select('_id name');

        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }

        const targetUser = await User.findById(userId).select('_id');

        if (!targetUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const orgMember = await OrganizationMember.findOne({
            user: userId,
            organization: organizationId,
            status: 'active'
        }).select('_id');

        if (!orgMember) {
            res.status(404).json({ success: false, message: 'User not found in your organization' });
            return;
        }

        const assignment = await ProjectMember.create({
            project: projectId,
            user: userId,
            role,
            organization: organizationId
        });

        // Send in-app notification to the added user
        try {
            await Notification.create({
                recipient: new Types.ObjectId(userId),
                sender: requesterId ?? null,
                type: 'PROJECT_UPDATED',
                title: 'Added to Project',
                message: `You have been added to the project "${(project as any).name}"`,
                relatedEntity: project._id,
                entityModel: 'Project',
                isRead: false,
            });
        } catch (notifError) {
            // Non-blocking: assignment is already created, just log the notification error
            console.error('Failed to create project assignment notification:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'User successfully assigned to project',
            data: assignment
        });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000) {
            res.status(409).json({ success: false, message: 'This user is already assigned to this project' });
            return;
        }

        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};

export const removeUserFromProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const projectId = req.params.projectId as string;
        const userId = req.params.userId as string;
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : undefined;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found' });
            return;
        }

        if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(userId)) {
            res.status(400).json({ success: false, message: 'Invalid project ID or user ID' });
            return;
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: organizationId
        }).select('_id name owner');

        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }

        // Prevent removing the project owner
        const ownerId = typeof project.owner === 'object' ? project.owner.toString() : project.owner;
        if (ownerId === userId) {
            res.status(400).json({ success: false, message: 'Cannot remove the project owner from the project' });
            return;
        }

        const deleted = await ProjectMember.findOneAndDelete({
            project: projectId,
            user: userId,
            organization: organizationId
        });

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Member not found in this project' });
            return;
        }

        // Send in-app notification to the removed user
        try {
            await Notification.create({
                recipient: new Types.ObjectId(userId),
                sender: requesterId ?? null,
                type: 'PROJECT_UPDATED',
                title: 'Removed from Project',
                message: `You have been removed from the project "${(project as any).name}"`,
                relatedEntity: project._id,
                entityModel: 'Project',
                isRead: false,
            });
        } catch (notifError) {
            console.error('Failed to create project removal notification:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'User successfully removed from project',
            data: null
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message, data: null });
    }
};
