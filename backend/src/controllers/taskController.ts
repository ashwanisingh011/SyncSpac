import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Label from '../models/Label.js';
import User from '../models/User.js';
import OrganizationMember from '../models/OrganizationMember.js';
import TaskHistory from '../models/TaskHistory.js';
import TaskTimeLog from '../models/TaskTimeLog.js';
import TaskDependency from '../models/TaskDependency.js';
import { UserRole } from '../types/roles.js';
import { getAccessLevel, isSuperAdminRole, normalizeRoleCode } from '../utils/rbacMatrix.js';
import { parseAndNotifyMentions } from '../utils/mentions.js';
import { createNotification, createNotifications, type CreateNotificationParams } from '../utils/notificationHelper.js';

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

const buildTaskQuery = (identifier: string, organizationId: Types.ObjectId) => {
    if (Types.ObjectId.isValid(identifier)) {
        return { _id: new Types.ObjectId(identifier), organization: organizationId };
    }

    return { taskKey: identifier, organization: organizationId };
};

const getActorName = (user: Request['user']): string => {
    return user?.firstName || user?.name || 'A team member';
};

const sameId = (left?: Types.ObjectId | string | null, right?: Types.ObjectId | string | null): boolean => {
    return Boolean(left && right && left.toString() === right.toString());
};

type AssigneeResolution = {
    assigneeId: Types.ObjectId | null;
    error?: { status: number; message: string };
};

const resolveAssignableAssignee = async (
    value: unknown,
    organizationId: Types.ObjectId
): Promise<AssigneeResolution> => {
    const rawAssigneeId = getIdentifier(value);

    if (!rawAssigneeId) {
        return { assigneeId: null };
    }

    if (!Types.ObjectId.isValid(rawAssigneeId)) {
        return {
            assigneeId: null,
            error: { status: 400, message: 'Invalid assignee ID' }
        };
    }

    const assigneeId = new Types.ObjectId(rawAssigneeId);
    const [assignee, organizationMember] = await Promise.all([
        User.findOne({ _id: assigneeId, isActive: true }).select('role'),
        OrganizationMember.findOne({ organization: organizationId, user: assigneeId }).select('role status')
    ]);

    if (!assignee) {
        return {
            assigneeId: null,
            error: { status: 404, message: 'Assignee not found' }
        };
    }

    if (!organizationMember || organizationMember.status !== 'active') {
        return {
            assigneeId: null,
            error: { status: 400, message: 'Only active workspace members can be assigned tasks' }
        };
    }

    const roleText = `${assignee.role ?? ''} ${organizationMember?.role ?? ''}`.toLowerCase();
    if (roleText.includes(UserRole.CLIENT)) {
        return {
            assigneeId: null,
            error: { status: 400, message: 'Client users cannot be assigned tasks' }
        };
    }

    return { assigneeId };
};

const uniqueTaskNotificationRecipients = (
    task: { watchers?: Types.ObjectId[]; assignedTo?: Types.ObjectId | null },
    requesterId?: Types.ObjectId | null
): Types.ObjectId[] => {
    const recipients = new Map<string, Types.ObjectId>();

    if (task.assignedTo && !sameId(task.assignedTo, requesterId)) {
        recipients.set(task.assignedTo.toString(), task.assignedTo);
    }

    for (const watcherId of task.watchers || []) {
        if (!sameId(watcherId, requesterId)) {
            recipients.set(watcherId.toString(), watcherId);
        }
    }

    return Array.from(recipients.values());
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
        const projectId = getIdentifier(req.body.projectId);
        const title = getIdentifier(req.body.title);

        if (!organizationId || !requesterId) {
            res.status(403).json({ success: false, message: 'Organization not found', data: null });
            return;
        }

        if (!projectId || !title) {
            res.status(400).json({ success: false, message: 'Title and project ID are required', data: null });
            return;
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: organizationId
        }).select('_id');

        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found or access denied', data: null });
            return;
        }

        const roleStr = req.user?.role as string;
        const assignLevel = isSuperAdminRole(roleStr)
            ? 'ALLOW'
            : getAccessLevel(roleStr, 'assign_task');

        let finalAssigneeId: Types.ObjectId | undefined = undefined;

        if (assignLevel === 'ALLOW') {
            const assigneeResolution = await resolveAssignableAssignee(req.body.assignedTo || req.body.assigneeId, organizationId);
            if (assigneeResolution.error) {
                res.status(assigneeResolution.error.status).json({
                    success: false,
                    message: assigneeResolution.error.message,
                    data: null
                });
                return;
            }
            finalAssigneeId = assigneeResolution.assigneeId ?? undefined;
        } else {
            const requestedAssignee = req.body.assignedTo || req.body.assigneeId;
            if (requestedAssignee) {
                const assigneeResolution = await resolveAssignableAssignee(requestedAssignee, organizationId);
                if (assigneeResolution.error) {
                    res.status(assigneeResolution.error.status).json({
                        success: false,
                        message: assigneeResolution.error.message,
                        data: null
                    });
                    return;
                }
                const resolvedAssigneeId = assigneeResolution.assigneeId;
                if (resolvedAssigneeId && resolvedAssigneeId.toString() !== requesterId.toString()) {
                    res.status(403).json({
                        success: false,
                        message: 'Access denied: you can only assign tasks to yourself',
                        data: null
                    });
                    return;
                }
                finalAssigneeId = resolvedAssigneeId ?? undefined;
            } else {
                // Auto-assign to the creator since they cannot assign tasks to others
                finalAssigneeId = requesterId;
            }
        }

        const task = await Task.create({
            title,
            description: req.body.description ?? '',
            type: req.body.type ?? 'task',
            status: req.body.status ?? 'todo',
            priority: req.body.priority ?? 'medium',
            dueDate: req.body.dueDate,
            estimatedTime: req.body.estimatedTime,
            assignedTo: finalAssigneeId,
            assignedBy: finalAssigneeId ? requesterId : undefined,
            project: project._id,
            organization: organizationId,
            labels: req.body.labels ?? [],
            sprintId: req.body.sprintId ? new Types.ObjectId(req.body.sprintId.toString()) : null,
            storyPoints: req.body.storyPoints ? Number(req.body.storyPoints) : 0,
            createdBy: requesterId
        });

        const updatedProject = await Project.findOneAndUpdate(
            {
                _id: project._id,
                organization: organizationId
            },
            { $inc: { taskCount: 1 } },
            { new: true }
        );

        if (!updatedProject) {
            await Task.findOneAndDelete({
                _id: task._id,
                organization: organizationId
            });

            res.status(500).json({ success: false, message: 'Failed to update project task count', data: null });
            return;
        }

        // Log Task History creation
        await TaskHistory.create({
            task: task._id,
            user: requesterId,
            action: 'create',
            newValue: `Task created under key ${task.taskKey}`
        });

        if (task.assignedTo && !sameId(task.assignedTo, requesterId)) {
            await createNotification({
                recipient: task.assignedTo,
                sender: requesterId,
                type: 'TASK_ASSIGNED',
                title: `Assigned to ${task.taskKey}`,
                message: `${getActorName(req.user)} assigned you to "${task.title}".`,
                relatedEntity: task._id,
                entityModel: 'Task',
            });
        }

        const populatedTask = await task.populate([
            { path: 'labels' },
            { path: 'assignedTo', select: 'name email avatar' },
            { path: 'createdBy', select: 'name email avatar' },
            { path: 'assignedBy', select: 'name email avatar' }
        ]);

        try {
            const { getIO } = await import('../config/socket.js');
            getIO().to(task.project.toString()).emit('task:created', populatedTask);
        } catch (err) { }

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: populatedTask
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const getProjectTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const projectId = getIdentifier(req.params.projectId);
        const userId = req.user?._id;
        const userRole = req.user?.role;


        if (!organizationId || !userId) {
            res.status(403).json({ success: false, message: 'Organization or User not found', data: null });
            return;
        }

        if (!projectId) {
            res.status(400).json({ success: false, message: 'Project ID is required', data: null });
            return;
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: organizationId
        }).select('_id');

        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found', data: null });
            return;
        }

        let queryCondition: any = {
            project: project._id,
            organization: organizationId,

        }

        const normalizedRole = normalizeRoleCode(userRole);
        if (
            normalizedRole !== 'superadmin' &&
            normalizedRole !== 'org_admin' &&
            normalizedRole !== 'project_manager' &&
            normalizedRole !== 'client'
        ) {
            queryCondition.$or = [
                { assignedTo: userId },
                { createdBy: userId }
            ];
        }

        const tasks = await Task.find(queryCondition)
            .sort({ sequence: 1 })
            .populate('labels')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('assignedBy', 'name email avatar');

        res.status(200).json({
            success: true,
            message: 'Tasks fetched successfully',
            data: tasks
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const identifier = getIdentifier(req.params.taskIdentifier ?? req.params.id);
        const userId = req.user?._id;
        const userRole = req.user?.role;

        if (!organizationId || !userId) {
            res.status(403).json({ success: false, message: 'Organization or User not found', data: null });
            return;
        }

        if (!identifier) {
            res.status(400).json({ success: false, message: 'Task identifier is required', data: null });
            return;
        }

        let queryCondition: any = buildTaskQuery(identifier, organizationId);

        const normalizedRole = normalizeRoleCode(userRole);
        if (normalizedRole !== 'superadmin' && normalizedRole !== 'org_admin' && normalizedRole !== 'project_manager') {
            queryCondition.$or = [
                { assignedTo: userId },
                { createdBy: userId }
            ];
        }

        const task = await Task.findOne(queryCondition)
            .populate('labels')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('assignedBy', 'name email avatar');

        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Task fetched successfully',
            data: task
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const identifier = getIdentifier(req.params.id);
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;

        if (!organizationId || !requesterId) {
            res.status(403).json({ success: false, message: 'Organization or user not found', data: null });
            return;
        }

        const userId = req.user?._id;
        const userRole = req.user?.role;

        if (!organizationId || !userId) {
            res.status(403).json({ success: false, message: 'Organization or User not found', data: null });
            return;
        }

        if (!identifier) {
            res.status(400).json({ success: false, message: 'Task identifier is required', data: null });
            return;
        }

        const taskQuery = buildTaskQuery(identifier, organizationId);
        const existingTask = await Task.findOne(taskQuery);

        if (!existingTask) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const normalizedRole = normalizeRoleCode(userRole);

        const editLevel = isSuperAdminRole(userRole) ? 'ALLOW' : getAccessLevel(userRole, 'edit_task');
        if (editLevel === 'DENY') {
            res.status(403).json({
                success: false,
                message: 'Access denied: you do not have permission to edit tasks',
                data: null
            });
            return;
        }
        if (editLevel === 'OWN') {
            const isCreator = existingTask.createdBy && existingTask.createdBy.toString() === requesterId.toString();
            const isAssignee = existingTask.assignedTo && existingTask.assignedTo.toString() === requesterId.toString();
            if (!isCreator && !isAssignee) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied: you can only edit tasks you created or are assigned to',
                    data: null
                });
                return;
            }
        }

        if (req.body.description !== undefined) {
            if (normalizedRole === 'developer' || normalizedRole === 'qa_tester') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied: Developers and QA testers cannot change the task description',
                    data: null
                });
                return;
            }
        }

        if (req.body.storyPoints !== undefined) {
            const isCreator = existingTask.createdBy && existingTask.createdBy.toString() === requesterId.toString();
            const isOrgAdmin = normalizedRole === 'org_admin' || isSuperAdminRole(userRole);
            if (!isCreator && !isOrgAdmin) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied: Story points can only be edited by the task creator or an organization administrator',
                    data: null
                });
                return;
            }
        }

        const updatePayload: Record<string, unknown> = {};

        if (req.body.title !== undefined) updatePayload.title = req.body.title;
        if (req.body.description !== undefined) updatePayload.description = req.body.description;
        if (req.body.type !== undefined) updatePayload.type = req.body.type;
        if (req.body.status !== undefined) updatePayload.status = req.body.status;
        if (req.body.priority !== undefined) updatePayload.priority = req.body.priority;
        if (req.body.dueDate !== undefined) updatePayload.dueDate = req.body.dueDate;
        if (req.body.estimatedTime !== undefined) updatePayload.estimatedTime = req.body.estimatedTime;
        if (req.body.labels !== undefined) updatePayload.labels = req.body.labels;
        if (req.body.sprintId !== undefined) {
            updatePayload.sprintId = req.body.sprintId ? new Types.ObjectId(req.body.sprintId.toString()) : null;
        }
        if (req.body.storyPoints !== undefined) {
            updatePayload.storyPoints = req.body.storyPoints !== null ? Number(req.body.storyPoints) : 0;
        }

        const assigneeField = req.body.assignedTo ?? req.body.assigneeId;
        if (assigneeField !== undefined) {
            const roleStr = req.user?.role as string;
            const assignLevel = isSuperAdminRole(roleStr)
                ? 'ALLOW'
                : getAccessLevel(roleStr, 'assign_task');
            const assigneeResolution = await resolveAssignableAssignee(assigneeField, organizationId);
            if (assigneeResolution.error) {
                res.status(assigneeResolution.error.status).json({
                    success: false,
                    message: assigneeResolution.error.message,
                    data: null,
                });
                return;
            }
            if (assignLevel !== 'ALLOW') {
                const resolvedAssigneeId = assigneeResolution.assigneeId;
                const isChanging = String(existingTask.assignedTo) !== String(resolvedAssigneeId);
                if (isChanging && (!resolvedAssigneeId || resolvedAssigneeId.toString() !== requesterId.toString())) {
                    res.status(403).json({
                        success: false,
                        message: 'Access denied: you do not have permission to assign tasks to other users',
                        data: null,
                    });
                    return;
                }
            }
            updatePayload.assignedTo = assigneeResolution.assigneeId;
            if (String(existingTask.assignedTo) !== String(assigneeResolution.assigneeId)) {
                updatePayload.assignedBy = requesterId;
            }
        }

        if (req.body.status === 'done') {
            const activeDependencies = await TaskDependency.find({
                $or: [
                    { task: existingTask._id, type: 'blocked-by' },
                    { dependsOn: existingTask._id, type: 'blocks' }
                ]
            });

            const blockerIds = activeDependencies.map(dep =>
                dep.type === 'blocked-by' ? dep.dependsOn : dep.task
            );

            if (blockerIds.length > 0) {
                const incompleteBlockers = await Task.find({
                    _id: { $in: blockerIds },
                    status: { $ne: 'done' }
                }).select('taskKey title status');

                if (incompleteBlockers.length > 0) {
                    const blockerList = incompleteBlockers.map(t => `${t.taskKey}: "${t.title}" (${t.status})`).join(', ');
                    res.status(400).json({
                        success: false,
                        message: `Cannot close task because it is blocked by incomplete dependencies: ${blockerList}`,
                        data: null
                    });
                    return;
                }
            }
        }

        const updatedTask = await Task.findOneAndUpdate(
            taskQuery,
            { $set: updatePayload },
            { new: true, runValidators: true }
        )
            .populate('labels')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('assignedBy', 'name email avatar');

        if (!updatedTask) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        // Compare changes and write audit trail
        const changes: any[] = [];
        const trackedFields = ['title', 'description', 'type', 'status', 'priority', 'dueDate', 'estimatedTime', 'sprintId', 'storyPoints', 'assignedTo'];

        for (const field of trackedFields) {
            if (updatePayload[field] !== undefined) {
                const oldVal = (existingTask as any)[field];
                const newVal = (updatedTask as any)[field];

                const oldStr = oldVal instanceof Date ? oldVal.toISOString() : (oldVal !== null && oldVal !== undefined ? String(oldVal) : '');
                const newStr = newVal instanceof Date ? newVal.toISOString() : (newVal !== null && newVal !== undefined ? String(newVal) : '');

                if (oldStr !== newStr) {
                    changes.push({
                        task: updatedTask._id,
                        user: requesterId,
                        action: 'update',
                        field,
                        oldValue: oldStr || 'None',
                        newValue: newStr || 'None',
                    });
                }
            }
        }

        if (changes.length > 0) {
            await TaskHistory.insertMany(changes);
        }

        const actorName = getActorName(req.user);
        const assignmentChanged = updatePayload.assignedTo !== undefined && !sameId(existingTask.assignedTo, updatedTask.assignedTo);
        const completedNow = existingTask.status !== 'done' && updatedTask.status === 'done';
        const notifications: CreateNotificationParams[] = [];

        if (assignmentChanged && updatedTask.assignedTo && !sameId(updatedTask.assignedTo, requesterId)) {
            notifications.push({
                recipient: updatedTask.assignedTo,
                sender: requesterId,
                type: 'TASK_ASSIGNED',
                title: `Assigned to ${updatedTask.taskKey}`,
                message: `${actorName} assigned you to "${updatedTask.title}".`,
                relatedEntity: updatedTask._id,
                entityModel: 'Task',
            });
        }

        if (completedNow) {
            for (const recipient of uniqueTaskNotificationRecipients(updatedTask, requesterId)) {
                notifications.push({
                    recipient,
                    sender: requesterId,
                    type: 'TASK_COMPLETED',
                    title: `${updatedTask.taskKey} completed`,
                    message: `${actorName} marked "${updatedTask.title}" as done.`,
                    relatedEntity: updatedTask._id,
                    entityModel: 'Task',
                });
            }
        } else if (changes.length > 0) {
            const excludedRecipient = assignmentChanged ? updatedTask.assignedTo : null;
            const watcherRecipients = (updatedTask.watchers || []).filter(
                (watcherId) => !sameId(watcherId, requesterId) && !sameId(watcherId, excludedRecipient)
            );

            for (const recipient of watcherRecipients) {
                notifications.push({
                    recipient,
                    sender: requesterId,
                    type: 'PROJECT_UPDATED',
                    title: `${updatedTask.taskKey} updated`,
                    message: `${actorName} updated "${updatedTask.title}".`,
                    relatedEntity: updatedTask._id,
                    entityModel: 'Task',
                });
            }
        }

        await createNotifications(notifications);

        // Parse mentions in the updated description (if provided)
        if (req.body.description !== undefined && req.body.description.trim()) {
            await parseAndNotifyMentions(
                req.body.description.trim(),
                updatedTask._id,
                updatedTask.taskKey,
                updatedTask.title,
                requesterId,
                req.user?.firstName || 'A team member',
                [], // no pre-existing recipients for task description mentions
                'description'
            );
        }

        try {
            const { getIO } = await import('../config/socket.js');
            getIO().to(updatedTask.project.toString()).emit('task:updated', {
                taskId: updatedTask._id,
                changes: updatePayload
            });
        } catch (err) { }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const identifier = getIdentifier(req.params.id);

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found', data: null });
            return;
        }

        if (!identifier) {
            res.status(400).json({ success: false, message: 'Task identifier is required', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(identifier, organizationId));

        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const updatedProject = await Project.findOneAndUpdate(
            {
                _id: task.project,
                organization: organizationId
            },
            { $inc: { taskCount: -1 } },
            { new: true }
        );

        if (!updatedProject) {
            res.status(404).json({ success: false, message: 'Project not found', data: null });
            return;
        }

        const deletedTask = await Task.findOneAndDelete({
            _id: task._id,
            organization: organizationId
        });

        if (!deletedTask) {
            await Project.findOneAndUpdate(
                {
                    _id: task.project,
                    organization: organizationId
                },
                { $inc: { taskCount: 1 } }
            );

            res.status(500).json({ success: false, message: 'Failed to delete task', data: null });
            return;
        }

        try {
            const { getIO } = await import('../config/socket.js');
            getIO().to(task.project.toString()).emit('task:deleted', { taskId: task._id });
        } catch (err) { }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
            data: deletedTask
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const watchTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const identifier = getIdentifier(req.params.id);
        const userId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;

        if (!organizationId || !userId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!identifier) {
            res.status(400).json({ success: false, message: 'Task identifier is required', data: null });
            return;
        }

        const task = await Task.findOneAndUpdate(
            buildTaskQuery(identifier, organizationId),
            { $addToSet: { watchers: userId } },
            { new: true }
        );

        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'You are now watching this task',
            data: task
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const unwatchTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const identifier = getIdentifier(req.params.id);
        const userId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;

        if (!organizationId || !userId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!identifier) {
            res.status(400).json({ success: false, message: 'Task identifier is required', data: null });
            return;
        }

        const task = await Task.findOneAndUpdate(
            buildTaskQuery(identifier, organizationId),
            { $pull: { watchers: userId } },
            { new: true }
        );

        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'You have stopped watching this task',
            data: task
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const addChecklistItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);
        const { title } = req.body;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId) {
            res.status(400).json({ success: false, message: 'Task identifier is required', data: null });
            return;
        }

        if (!title || !title.trim()) {
            res.status(400).json({ success: false, message: 'Checklist item title is required', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(taskId, organizationId));
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const newItem = {
            _id: new Types.ObjectId(),
            title: title.trim(),
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        task.checklist.push(newItem as any);
        await task.save();

        res.status(201).json({
            success: true,
            message: 'Checklist item added successfully',
            data: newItem
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const updateChecklistItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);
        const { itemId } = req.params;
        const { title, isCompleted } = req.body;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId || !itemId) {
            res.status(400).json({ success: false, message: 'Task ID and Checklist Item ID are required', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(taskId, organizationId));
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        // Mongoose subdocument helper to find by ID
        const checklistItem = (task.checklist as any).id(itemId);
        if (!checklistItem) {
            res.status(404).json({ success: false, message: 'Checklist item not found', data: null });
            return;
        }

        if (title !== undefined) {
            checklistItem.title = title.trim();
        }
        if (isCompleted !== undefined) {
            checklistItem.isCompleted = isCompleted;
        }

        await task.save();

        res.status(200).json({
            success: true,
            message: 'Checklist item updated successfully',
            data: checklistItem
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const deleteChecklistItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);
        const { itemId } = req.params;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId || !itemId) {
            res.status(400).json({ success: false, message: 'Task ID and Checklist Item ID are required', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(taskId, organizationId));
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const checklistItem = (task.checklist as any).id(itemId);
        if (!checklistItem) {
            res.status(404).json({ success: false, message: 'Checklist item not found', data: null });
            return;
        }

        (task.checklist as any).pull(itemId);
        await task.save();

        res.status(200).json({
            success: true,
            message: 'Checklist item deleted successfully',
            data: null
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const attachLabel = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);
        const { labelId } = req.body;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId || !labelId) {
            res.status(400).json({ success: false, message: 'Task ID and Label ID are required', data: null });
            return;
        }

        // Validate that the label exists in the user's organization
        const label = await Label.findOne({ _id: labelId, organization: organizationId }).select('_id');
        if (!label) {
            res.status(404).json({ success: false, message: 'Label not found or access denied', data: null });
            return;
        }

        const task = await Task.findOneAndUpdate(
            buildTaskQuery(taskId, organizationId),
            { $addToSet: { labels: labelId } },
            { new: true }
        ).populate('labels');

        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Label attached successfully',
            data: task
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const detachLabel = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);
        const { labelId } = req.body;

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId || !labelId) {
            res.status(400).json({ success: false, message: 'Task ID and Label ID are required', data: null });
            return;
        }

        const task = await Task.findOneAndUpdate(
            buildTaskQuery(taskId, organizationId),
            { $pull: { labels: labelId } },
            { new: true }
        ).populate('labels');

        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Label detached successfully',
            data: task
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const getTaskHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const identifier = getIdentifier(req.params.id);

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found', data: null });
            return;
        }

        if (!identifier) {
            res.status(400).json({ success: false, message: 'Task identifier is required', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(identifier, organizationId)).select('_id');
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const history = await TaskHistory.find({ task: task._id })
            .populate('user', 'firstName lastName username avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Task history fetched successfully',
            data: history
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const logTime = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
        const { duration, description, loggedAt } = req.body;

        if (!organizationId || !requesterId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId) {
            res.status(400).json({ success: false, message: 'Task ID is required', data: null });
            return;
        }

        if (duration === undefined || duration === null || isNaN(Number(duration)) || Number(duration) < 1) {
            res.status(400).json({ success: false, message: 'Duration must be a positive number of minutes (at least 1)', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(taskId, organizationId)).select('_id');
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const log = await TaskTimeLog.create({
            task: task._id,
            user: requesterId,
            duration: Number(duration),
            description: description || '',
            loggedAt: loggedAt ? new Date(loggedAt) : new Date()
        });

        const populatedLog = await log.populate('user', 'firstName lastName username avatar');

        res.status(201).json({
            success: true,
            message: 'Time logged successfully',
            data: populatedLog
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const getTaskTimeLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId) {
            res.status(400).json({ success: false, message: 'Task ID is required', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(taskId, organizationId)).select('_id');
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const logs = await TaskTimeLog.find({ task: task._id })
            .populate('user', 'firstName lastName username avatar')
            .sort({ loggedAt: -1 });

        const totalLoggedMinutes = logs.reduce((sum, log) => sum + log.duration, 0);

        res.status(200).json({
            success: true,
            message: 'Time logs fetched successfully',
            data: {
                logs,
                totalLoggedMinutes
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const deleteTimeLog = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getIdentifier(req.params.id);
        const { logId } = req.params;
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
        const userRole = req.user?.role;

        if (!organizationId || !requesterId || !userRole) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!taskId || !logId) {
            res.status(400).json({ success: false, message: 'Task ID and Time Log ID are required', data: null });
            return;
        }

        const task = await Task.findOne(buildTaskQuery(taskId, organizationId)).select('_id');
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const log = await TaskTimeLog.findById(logId);
        if (!log) {
            res.status(404).json({ success: false, message: 'Time log not found', data: null });
            return;
        }

        // RBAC: Only the log creator OR an organization admin/project manager can delete the log
        const isOwner = log.user.toString() === requesterId.toString();
        const normalizedRole = normalizeRoleCode(userRole);
        const isAdmin = ['superadmin', 'org_admin', 'project_manager'].includes(normalizedRole);

        if (!isOwner && !isAdmin) {
            res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to delete this time log', data: null });
            return;
        }

        await TaskTimeLog.findByIdAndDelete(logId);

        res.status(200).json({
            success: true,
            message: 'Time log deleted successfully',
            data: null
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const reorderTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;
        const { tasks } = req.body;

        if (!organizationId || !requesterId) {
            res.status(403).json({ success: false, message: 'Not authorized', data: null });
            return;
        }

        if (!tasks || !Array.isArray(tasks)) {
            res.status(400).json({ success: false, message: 'Invalid payload: tasks must be an array', data: null });
            return;
        }

        // Check for dependency blocks if any task is being set to 'done'
        const doneTasks = tasks.filter((t: any) => t.status === 'done');
        for (const doneTask of doneTasks) {
            const taskId = new Types.ObjectId(doneTask._id);
            const taskObj = await Task.findOne({ _id: taskId, organization: organizationId }).select('taskKey title');
            if (!taskObj) continue;

            const activeDependencies = await TaskDependency.find({
                $or: [
                    { task: taskId, type: 'blocked-by' },
                    { dependsOn: taskId, type: 'blocks' }
                ]
            });

            const blockerIds = activeDependencies.map(dep =>
                dep.type === 'blocked-by' ? dep.dependsOn : dep.task
            );

            if (blockerIds.length > 0) {
                const incompleteBlockers = await Task.find({
                    _id: { $in: blockerIds },
                    status: { $ne: 'done' }
                }).select('taskKey title status');

                // Filter out blockers that are also being set to 'done' in this batch
                const actualIncompleteBlockers = incompleteBlockers.filter(blocker => {
                    const beingCompleted = tasks.some((t: any) => t._id === blocker._id.toString() && t.status === 'done');
                    return !beingCompleted;
                });

                if (actualIncompleteBlockers.length > 0) {
                    const blockerList = actualIncompleteBlockers.map(t => `${t.taskKey}: "${t.title}" (${t.status})`).join(', ');
                    res.status(400).json({
                        success: false,
                        message: `Cannot close task "${taskObj.taskKey}" because it is blocked by incomplete dependencies: ${blockerList}`,
                        data: null
                    });
                    return;
                }
            }
        }

        const doneTaskIds = doneTasks
            .filter((taskItem: any) => taskItem._id && Types.ObjectId.isValid(taskItem._id))
            .map((taskItem: any) => new Types.ObjectId(taskItem._id));

        const newlyCompletedTasks = doneTaskIds.length > 0
            ? await Task.find({
                _id: { $in: doneTaskIds },
                organization: organizationId,
                status: { $ne: 'done' },
            }).select('_id taskKey title assignedTo watchers')
            : [];

        // Prepare bulk write operations
        const bulkOps = tasks.map((taskItem: any) => {
            const { _id, status, sequence, sprintId } = taskItem;

            if (!_id || !Types.ObjectId.isValid(_id) || status === undefined || sequence === undefined) {
                throw new Error('Invalid task item format');
            }

            const updateFields: any = { status, sequence: Number(sequence) };
            if (sprintId !== undefined) {
                updateFields.sprintId = sprintId ? new Types.ObjectId(sprintId.toString()) : null;
            }

            return {
                updateOne: {
                    filter: { _id: new Types.ObjectId(_id), organization: organizationId },
                    update: { $set: updateFields }
                }
            };
        });

        const result = await Task.bulkWrite(bulkOps);

        const actorName = getActorName(req.user);
        const completionNotifications: CreateNotificationParams[] = [];

        for (const task of newlyCompletedTasks) {
            for (const recipient of uniqueTaskNotificationRecipients(task, requesterId)) {
                completionNotifications.push({
                    recipient,
                    sender: requesterId,
                    type: 'TASK_COMPLETED',
                    title: `${task.taskKey} completed`,
                    message: `${actorName} marked "${task.title}" as done.`,
                    relatedEntity: task._id,
                    entityModel: 'Task',
                });
            }
        }

        await createNotifications(completionNotifications);

        // Emit socket updates to project room
        try {
            if (tasks.length > 0) {
                const sampleTask = await Task.findById(tasks[0]._id).select('project');
                if (sampleTask && sampleTask.project) {
                    const { getIO } = await import('../config/socket.js');
                    getIO().to(sampleTask.project.toString()).emit('tasks:reordered', { tasks });
                }
            }
        } catch (err) { }

        res.status(200).json({
            success: true,
            message: 'Tasks reordered successfully',
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

const checkCircularDependency = async (
    taskId: Types.ObjectId,
    dependsOnId: Types.ObjectId,
    visited: Set<string> = new Set()
): Promise<boolean> => {
    if (dependsOnId.toString() === taskId.toString()) {
        return true;
    }

    const dependsOnStr = dependsOnId.toString();
    if (visited.has(dependsOnStr)) {
        return false;
    }
    visited.add(dependsOnStr);

    const directDeps = await TaskDependency.find({
        $or: [
            { task: dependsOnId, type: 'blocked-by' },
            { dependsOn: dependsOnId, type: 'blocks' }
        ]
    });

    for (const dep of directDeps) {
        const nextTargetId = dep.type === 'blocked-by' ? dep.dependsOn : dep.task;
        if (await checkCircularDependency(taskId, nextTargetId, visited)) {
            return true;
        }
    }

    return false;
};

export const addDependency = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskIdStr = getIdentifier(req.params.id);
        const { dependsOn: dependsOnStr, type } = req.body;
        const requesterId = req.user?._id ? new Types.ObjectId(req.user._id.toString()) : null;

        if (!organizationId || !requesterId) {
            res.status(403).json({ success: false, message: 'Organization or user not found', data: null });
            return;
        }

        if (!taskIdStr || !dependsOnStr) {
            res.status(400).json({ success: false, message: 'Both task and dependent task IDs are required', data: null });
            return;
        }

        const taskQuery = buildTaskQuery(taskIdStr, organizationId);
        const task = await Task.findOne(taskQuery);
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const dependsOnQuery = buildTaskQuery(dependsOnStr, organizationId);
        const dependsOnTask = await Task.findOne(dependsOnQuery);
        if (!dependsOnTask) {
            res.status(404).json({ success: false, message: 'Dependent task not found', data: null });
            return;
        }

        if (task._id.toString() === dependsOnTask._id.toString()) {
            res.status(400).json({ success: false, message: 'A task cannot depend on itself', data: null });
            return;
        }

        const dependencyType = type || 'blocked-by';
        if (!['blocks', 'blocked-by'].includes(dependencyType)) {
            res.status(400).json({ success: false, message: 'Invalid dependency type. Must be "blocks" or "blocked-by"', data: null });
            return;
        }

        const existingDep = await TaskDependency.findOne({
            task: task._id,
            dependsOn: dependsOnTask._id,
            type: dependencyType
        });

        if (existingDep) {
            res.status(400).json({ success: false, message: 'This dependency already exists', data: null });
            return;
        }

        let hasCycle = false;
        if (dependencyType === 'blocked-by') {
            hasCycle = await checkCircularDependency(task._id, dependsOnTask._id);
        } else {
            hasCycle = await checkCircularDependency(dependsOnTask._id, task._id);
        }

        if (hasCycle) {
            res.status(400).json({
                success: false,
                message: 'Circular dependency detected. Adding this dependency would create a loop.',
                data: null
            });
            return;
        }

        const dependency = new TaskDependency({
            task: task._id,
            dependsOn: dependsOnTask._id,
            type: dependencyType,
            createdBy: requesterId
        });

        await dependency.save();

        res.status(201).json({
            success: true,
            message: 'Dependency added successfully',
            data: dependency
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const removeDependency = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const dependencyId = getIdentifier(req.params.dependencyId);

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found', data: null });
            return;
        }

        if (!dependencyId || !Types.ObjectId.isValid(dependencyId)) {
            res.status(400).json({ success: false, message: 'Invalid dependency ID', data: null });
            return;
        }

        const dependency = await TaskDependency.findById(dependencyId).populate('task');
        if (!dependency) {
            res.status(404).json({ success: false, message: 'Dependency not found', data: null });
            return;
        }

        const taskObj = dependency.task as any;
        if (!taskObj || taskObj.organization.toString() !== organizationId.toString()) {
            res.status(403).json({ success: false, message: 'Access denied to this dependency', data: null });
            return;
        }

        await TaskDependency.deleteOne({ _id: dependencyId });

        res.status(200).json({
            success: true,
            message: 'Dependency removed successfully',
            data: null
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};

export const getTaskDependencies = async (req: Request, res: Response): Promise<void> => {
    try {
        const organizationId = getOrganizationId(req);
        const taskIdStr = getIdentifier(req.params.id);

        if (!organizationId) {
            res.status(403).json({ success: false, message: 'Organization not found', data: null });
            return;
        }

        if (!taskIdStr) {
            res.status(400).json({ success: false, message: 'Task ID is required', data: null });
            return;
        }

        const taskQuery = buildTaskQuery(taskIdStr, organizationId);
        const task = await Task.findOne(taskQuery);
        if (!task) {
            res.status(404).json({ success: false, message: 'Task not found', data: null });
            return;
        }

        const dependencies = await TaskDependency.find({
            $or: [{ task: task._id }, { dependsOn: task._id }]
        })
            .populate('task', '_id taskKey title status')
            .populate('dependsOn', '_id taskKey title status')
            .populate('createdBy', '_id username firstName lastName');

        res.status(200).json({
            success: true,
            message: 'Dependencies retrieved successfully',
            data: dependencies
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', data: null, error: error.message });
    }
};
