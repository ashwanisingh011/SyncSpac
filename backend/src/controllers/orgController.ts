import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Organization from '../models/Organization.js';
import OrganizationMember, { OrgRole } from '../models/OrganizationMember.js';
import WorkspaceSettings from '../models/WorkspaceSettings.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Role from '../models/Role.js';
import { getOrgSubscriptionStatus, sendLimitExceededEmail } from '../utils/subscription.js';
import { UserRole } from '../types/roles.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { buildInviteEmail } from '../utils/emailTemplate.js';
import {
    getRoleDescriptorMap,
    getWorkspaceCapabilitiesForRole,
    getWorkspaceCapabilitiesForRoles,
    getPermissionsForRole,
    isWorkspaceAssignableRole,
    listWorkspaceAssignableRoles,
} from '../utils/roleCatalog.js';

const INVITATION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

const hashInviteToken = (token: string): string =>
    crypto.createHash('sha256').update(token).digest('hex');

const normalizeInviteEmail = (email: string): string => email.toLowerCase().trim();

const resolveInviteRole = async (role: unknown): Promise<string> => {
    if (typeof role === 'string' && await isWorkspaceAssignableRole(role)) {
        return role;
    }
    return OrgRole.MEMBER;
};

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;
        const userId = req.user?._id;

        if (!name) {
            res.status(400).json({ success: false, message: "Organization name is required" });
            return;
        }

     
        const organization = await Organization.create({
            name,
            owner: userId
        });

        await OrganizationMember.create({
            organization: organization._id,
            user: userId,
            role: OrgRole.OWNER,
            status: 'active',
            joinedAt: new Date()
        });

        
        await WorkspaceSettings.create({
            organization: organization._id,
            primaryColor: '#000000',
            secondaryColor: '#FFFFFF',
            timezone: 'UTC',
            language: 'en'
        });

   
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                organization: organization._id,  
                role: UserRole.ORG_ADMIN 
            },
           { new: true }
        ).select('-password');

        res.status(201).json({ 
            success: true, 
            message: "Workspace created successfully", 
            data: { organization, user: updatedUser }
        });
        
    } catch(error: any) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

/**
 * @desc    Soft-delete an organization / workspace (Industry Standard)
 * @route   DELETE /api/organization/:orgId
 */

export const deleteWorkspace = async(req: Request, res: Response): Promise<void> =>{
    try {
        const {orgId} = req.params;
        const userId = req.user?._id;
    
        const membership = await OrganizationMember.findOne({
            organization: orgId,
            user: userId
        });
    
        if(!membership || membership.role !== OrgRole.OWNER){
            res.status(403).json({
                success: false,
                message: "Only workspace owner can delete the workspace"
            });
            return;
        }
    
        const organization = await Organization.findByIdAndUpdate(
            orgId,
            {isDeleted: true},
            {new: true}
        );
    
        if(!organization){
            res.status(404).json({
                success: false,
                message: "Workspace not found"
            })
            return;
        }
        res.status(200).json({
            success: true,
            message: "Workspace deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

const hasWorkspaceManagementAccess = async (organizationId: string, userId: string): Promise<boolean> => {
    const organization = await Organization.findById(organizationId).select('owner');

    if (!organization) {
        return false;
    }

    if (organization.owner.toString() === userId) {
        return true;
    }

    const member = await OrganizationMember.findOne({
        organization: organizationId,
        user: userId,
        status: 'active',
    });
    if (!member) {
        return false;
    }

    const capabilities = await getWorkspaceCapabilitiesForRole(member.role);
    return capabilities.canManageWorkspace;
};

const toObjectId = (value: string): Types.ObjectId | null => {
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
};

const getActiveMember = async (organizationId: string, userId: string) => {
    return OrganizationMember.findOne({
        organization: organizationId,
        user: userId,
        status: 'active'
    });
};

const hasAdminPrivileges = async (organizationId: string, userId: string): Promise<boolean> => {
    const member = await OrganizationMember.findOne({
        organization: organizationId,
        user: userId,
        status: 'active',
    });
    if (!member) {
        return false;
    }

    const capabilities = await getWorkspaceCapabilitiesForRole(member.role);
    return capabilities.canManageMembers;
};

export const inviteUserToWorkspace = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const { email, role } = req.body;
        const requesterId = req.user?._id;

        if (typeof orgId !== 'string' || !Types.ObjectId.isValid(orgId)) {
            res.status(400).json({ success: false, message: 'Invalid or missing Organization ID' });
            return;
        }

        if (!email || typeof email !== 'string') {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        if (!requesterId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const normalizedEmail = normalizeInviteEmail(email);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            res.status(400).json({ success: false, message: 'Invalid email address' });
            return;
        }

        const canManage = await hasAdminPrivileges(orgId, requesterId.toString());
        if (!canManage) {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions to invite members' });
            return;
        }

        const organization = await Organization.findById(orgId);
        if (!organization || organization.isDeleted) {
            res.status(404).json({ success: false, message: 'Organization not found' });
            return;
        }

        const inviteRole = await resolveInviteRole(role);
        const targetUser = await User.findOne({ email: normalizedEmail });

        if (targetUser) {
            const existingMember = await OrganizationMember.findOne({
                organization: orgId,
                user: targetUser._id,
            });

            if (existingMember?.status === 'active') {
                res.status(400).json({ success: false, message: 'User is already an active member of this organization.' });
                return;
            }
        }

        const existingInvite = await Invitation.findOne({
            email: normalizedEmail,
            organization: orgId,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });

        if (existingInvite) {
            res.status(400).json({ success: false, message: 'A pending invitation has already been sent to this email.' });
            return;
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = hashInviteToken(inviteToken);

        await Invitation.create({
            email: normalizedEmail,
            organization: orgId,
            role: inviteRole,
            token: hashedToken,
            invitedBy: requesterId,
            status: 'pending',
            expiresAt: new Date(Date.now() + INVITATION_EXPIRATION_MS),
        });

        const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite/${inviteToken}`;
        const { message, html } = buildInviteEmail(organization.name, inviteUrl);

        await sendEmail({
            email: normalizedEmail,
            subject: 'TaskBridge - Workspace Invitation',
            message,
            html,
        });

        res.status(200).json({ success: true, message: `Invitation sent securely to ${normalizedEmail}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const validateWorkspaceInvite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid or missing invitation token' });
            return;
        }

        let decodedToken = token;
        try {
            decodedToken = decodeURIComponent(token);
        } catch {
            decodedToken = token;
        }

        const hashedToken = hashInviteToken(decodedToken);

        const invitation = await Invitation.findOne({ token: hashedToken })
            .populate('organization', 'name');

        if (!invitation) {
            const legacyMembership = await OrganizationMember.findOne({
                invitedToken: hashedToken,
                invitedTokenExpire: { $gt: new Date() },
                status: 'pending',
            })
                .select('+invitedToken +invitedTokenExpire')
                .populate('organization', 'name')
                .populate('user', 'email');

            if (!legacyMembership) {
                res.status(404).json({ success: false, message: 'Invalid or expired invitation token' });
                return;
            }

            const legacyEmail =
                typeof legacyMembership.user === 'object' && legacyMembership.user !== null
                    ? (legacyMembership.user as { email?: string }).email
                    : undefined;

            res.status(200).json({
                success: true,
                data: {
                    valid: true,
                    email: legacyEmail ?? null,
                    organizationName:
                        typeof legacyMembership.organization === 'object' && legacyMembership.organization !== null
                            ? (legacyMembership.organization as { name?: string }).name
                            : null,
                    userExists: Boolean(legacyEmail),
                    expired: false,
                },
            });
            return;
        }

        if (invitation.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: `This invitation has already been ${invitation.status}.`,
            });
            return;
        }

        const expired = new Date() > invitation.expiresAt;
        if (expired) {
            invitation.status = 'expired';
            await invitation.save();
            res.status(400).json({ success: false, message: 'This invitation has expired.' });
            return;
        }

        const userExists = Boolean(await User.findOne({ email: invitation.email }));

        res.status(200).json({
            success: true,
            data: {
                valid: true,
                email: invitation.email,
                organizationName:
                    typeof invitation.organization === 'object' && invitation.organization !== null
                        ? (invitation.organization as { name?: string }).name
                        : null,
                role: invitation.role,
                userExists,
                expired: false,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const acceptWorkspaceInvite = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const userId = req.user?._id;
        const userEmail = req.user?.email;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid or missing invitation token' });
            return;
        }

        if (!userId || !userEmail) {
            res.status(401).json({ success: false, message: 'Authentication required to accept an invitation' });
            return;
        }

        let decodedToken = token;
        try {
            decodedToken = decodeURIComponent(token);
        } catch {
            decodedToken = token;
        }

        const hashedToken = hashInviteToken(decodedToken);

        const invitation = await Invitation.findOne({
            token: hashedToken,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });

        if (invitation) {
            if (normalizeInviteEmail(userEmail) !== invitation.email) {
                res.status(403).json({
                    success: false,
                    message: 'This invitation was sent to a different email address. Sign in with the invited email to continue.',
                });
                return;
            }

            invitation.status = 'accepted';
            await invitation.save();

            await OrganizationMember.findOneAndUpdate(
                { organization: invitation.organization, user: userId },
                {
                    role: invitation.role || OrgRole.MEMBER,
                    status: 'active',
                    joinedAt: new Date(),
                    invitedBy: invitation.invitedBy,
                    $unset: { invitedToken: '', invitedTokenExpire: '' },
                },
                { upsert: true, new: true },
            );

            const user = await User.findById(userId);
            if (user) {
                if (!user.organization) {
                    user.organization = invitation.organization;
                }
                user.role = (invitation.role || OrgRole.MEMBER) as UserRole;
                if (!user.organizations) {
                    user.organizations = [];
                }
                if (!user.organizations.some((org) => org.toString() === invitation.organization.toString())) {
                    user.organizations.push(invitation.organization);
                }
                await user.save({ validateBeforeSave: false });
            }

            res.status(200).json({
                success: true,
                message: 'Welcome to the workspace! Invitation accepted.',
            });
            return;
        }

        const pendingMembership = await OrganizationMember.findOne({
            invitedToken: hashedToken,
            invitedTokenExpire: { $gt: new Date() },
            status: 'pending',
        }).select('+invitedToken +invitedTokenExpire');

        if (!pendingMembership) {
            res.status(400).json({ success: false, message: 'Invalid or expired invitation token' });
            return;
        }

        if (pendingMembership.user.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'This invitation was sent to a different account. Sign in with the invited email to continue.',
            });
            return;
        }

        pendingMembership.status = 'active';
        pendingMembership.joinedAt = new Date();
        pendingMembership.invitedToken = undefined;
        pendingMembership.invitedTokenExpire = undefined;

        await pendingMembership.save();

        const user = await User.findById(pendingMembership.user);
        if (user) {
            if (!user.organization) {
                user.organization = pendingMembership.organization;
            }
            user.role = pendingMembership.role as UserRole;
            if (!user.organizations) {
                user.organizations = [];
            }
            if (!user.organizations.some((org) => org.toString() === pendingMembership.organization.toString())) {
                user.organizations.push(pendingMembership.organization);
            }
            await user.save({ validateBeforeSave: false });
        }

        res.status(200).json({
            success: true,
            message: 'Welcome to the workspace! Invitation accepted.',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const updateWorkspaceSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const { name, description, logoUrl, logo, primaryColor, secondaryColor, timezone, language, defaultLayout } = req.body;
        const requesterId = req.user?._id;

        if (typeof orgId !== 'string' || !requesterId) {
            res.status(400).json({ success: false, message: 'Organization ID is required' });
            return;
        }

        const canManageWorkspace = await hasWorkspaceManagementAccess(orgId, requesterId.toString());

        if (!canManageWorkspace) {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
            return;
        }

        const organizationUpdates: Record<string, unknown> = {};
        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                res.status(400).json({ success: false, message: 'Workspace name is required' });
                return;
            }
            organizationUpdates.name = name.trim();
        }
        if (description !== undefined) {
            organizationUpdates.description = typeof description === 'string' ? description.trim() : '';
        }
        if (logoUrl !== undefined || logo !== undefined) {
            const nextLogo = logoUrl ?? logo;
            organizationUpdates.logo = typeof nextLogo === 'string' ? nextLogo.trim() : '';
        }

        const settingsUpdates = {
            ...(primaryColor !== undefined ? { primaryColor } : {}),
            ...(secondaryColor !== undefined ? { secondaryColor } : {}),
            ...(timezone !== undefined ? { timezone } : {}),
            ...(language !== undefined ? { language } : {}),
            ...(defaultLayout !== undefined ? { defaultLayout } : {}),
        };
        const settingsUpdateDoc = Object.keys(settingsUpdates).length > 0
            ? { $set: settingsUpdates, $setOnInsert: { organization: orgId } }
            : { $setOnInsert: { organization: orgId } };

        const updatedOrganization = Object.keys(organizationUpdates).length > 0
            ? await Organization.findOneAndUpdate(
                { _id: orgId, isDeleted: { $ne: true } },
                { $set: organizationUpdates },
                { new: true, runValidators: true }
            ).select('name slug description logo plan owner isDeleted createdAt updatedAt')
            : await Organization.findOne({ _id: orgId, isDeleted: { $ne: true } })
                .select('name slug description logo plan owner isDeleted createdAt updatedAt');

        if (!updatedOrganization) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        const updatedSettings = await WorkspaceSettings.findOneAndUpdate(
            { organization: orgId },
            settingsUpdateDoc,
            {
                new: true,
                runValidators: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        if (!updatedSettings) {
            res.status(404).json({ success: false, message: 'Workspace settings not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Workspace settings updated successfully',
            data: {
                organization: updatedOrganization,
                settings: updatedSettings
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getWorkspaceSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const requesterId = req.user?._id;

        if (typeof orgId !== 'string' || !requesterId) {
            res.status(400).json({ success: false, message: 'Organization ID is required' });
            return;
        }

        const canManageWorkspace = await hasWorkspaceManagementAccess(orgId, requesterId.toString());

        if (!canManageWorkspace) {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
            return;
        }

        const organization = await Organization.findOne({ _id: orgId, isDeleted: { $ne: true } })
            .select('name slug description logo plan owner isDeleted createdAt updatedAt');

        if (!organization) {
            res.status(404).json({ success: false, message: 'Workspace not found' });
            return;
        }

        const settings = await WorkspaceSettings.findOneAndUpdate(
            { organization: orgId },
            { $setOnInsert: { organization: orgId } },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                organization,
                settings
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getMyWorkspaces = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(400).json({ success: false, message: 'User not found' });
            return;
        }

        const workspaces = await OrganizationMember.find({
            user: userId,
            status: 'active'
        }).populate('organization');

        const roleCodes = workspaces.map((workspace) => workspace.role);
        const roleDescriptorMap = await getRoleDescriptorMap(roleCodes);
        const capabilityMap = await getWorkspaceCapabilitiesForRoles(roleCodes);

        const orgIds = workspaces.map((w) => w.organization?._id).filter(Boolean);
        const memberCounts = await OrganizationMember.aggregate([
            { $match: { organization: { $in: orgIds }, status: 'active' } },
            { $group: { _id: '$organization', count: { $sum: 1 } } }
        ]);
        const memberCountMap = new Map<string, number>(
            memberCounts.map((item) => [item._id.toString(), item.count])
        );

        const workspacesWithPermissions = await Promise.all(
            workspaces.map(async (workspace) => {
                const permissions = await getPermissionsForRole(workspace.role);
                const memberCount = workspace.organization
                    ? (memberCountMap.get(workspace.organization._id.toString()) ?? 0)
                    : 0;
                const subStatus = workspace.organization
                    ? await getOrgSubscriptionStatus(workspace.organization._id)
                    : null;
                return {
                    ...workspace.toObject(),
                    roleName: roleDescriptorMap.get(workspace.role)?.name,
                    roleDescription: roleDescriptorMap.get(workspace.role)?.description,
                    capabilities: capabilityMap.get(workspace.role),
                    permissions,
                    memberCount,
                    subscriptionStatus: subStatus,
                };
            }),
        );


        res.status(200).json({
            success: true,
            message: 'Workspaces fetched successfully',
            data: workspacesWithPermissions,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getWorkspaceMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const userId = req.user?._id;

        if (typeof orgId !== 'string' || !userId) {
            res.status(400).json({ success: false, message: 'Organization ID is required' });
            return;
        }

        const organizationObjectId = toObjectId(orgId);

        if (!organizationObjectId) {
            res.status(400).json({ success: false, message: 'Invalid organization ID' });
            return;
        }

        const requesterMembership = await getActiveMember(organizationObjectId.toString(), userId.toString());

        if (!requesterMembership) {
            res.status(403).json({ success: false, message: 'Forbidden: Not an active member of this workspace' });
            return;
        }

        const members = await OrganizationMember.find({
            organization: organizationObjectId
        }).populate('user', 'name email username avatar');

        const roleCodes = members.map((member) => member.role);
        const roleDescriptorMap = await getRoleDescriptorMap(roleCodes);

        res.status(200).json({
            success: true,
            message: 'Workspace members fetched successfully',
            data: members.map((member) => ({
                ...member.toObject(),
                roleName: roleDescriptorMap.get(member.role)?.name,
                roleDescription: roleDescriptorMap.get(member.role)?.description,
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId, memberId } = req.params;
        const { role } = req.body;
        const requesterId = req.user?._id;

        if (typeof orgId !== 'string' || typeof memberId !== 'string' || !requesterId) {
            res.status(400).json({ success: false, message: 'Organization ID and member ID are required' });
            return;
        }

        if (!role) {
            res.status(400).json({ success: false, message: 'Role is required' });
            return;
        }

        const organizationObjectId = toObjectId(orgId);
        const memberObjectId = toObjectId(memberId);

        if (!organizationObjectId || !memberObjectId) {
            res.status(400).json({ success: false, message: 'Invalid organization ID or member ID' });
            return;
        }

        const requestedRole = String(role).trim();

        if (!await isWorkspaceAssignableRole(requestedRole)) {
            res.status(400).json({ success: false, message: 'Invalid role' });
            return;
        }

        const canManageWorkspace = await hasAdminPrivileges(orgId, requesterId.toString());

        if (!canManageWorkspace) {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
            return;
        }

        // Check if the requested role is a custom role
        const targetRole = await Role.findOne({ code: requestedRole });
        if (targetRole && !targetRole.isDefault) {
            const subStatus = await getOrgSubscriptionStatus(orgId);
            if (!subStatus.limits.customRoles) {
                await sendLimitExceededEmail(orgId, 'Custom Roles', '1', '0');
                res.status(403).json({
                    success: false,
                    message: `Custom Roles are not supported on your current plan (${subStatus.planName}). Please upgrade your subscription.`,
                    type: 'LIMIT_EXCEEDED',
                    limitType: 'customRoles',
                    currentUsage: 0,
                    allowedLimit: 0
                });
                return;
            }
        }


        const member = await OrganizationMember.findOneAndUpdate(
            {
                organization: organizationObjectId,
                user: memberObjectId
            },
            { $set: { role: requestedRole } },
            { new: true, runValidators: false }
        ).populate('user', 'name email username avatar');

        if (!member) {
            res.status(404).json({ success: false, message: 'Member not found' });
            return;
        }

        await User.findByIdAndUpdate(
            memberObjectId,
            { $set: { role: requestedRole } },
            { runValidators: false }
        );

        const roleDescriptorMap = await getRoleDescriptorMap([member.role]);

        res.status(200).json({
            success: true,
            message: 'Member role updated successfully',
            data: {
                ...member.toObject(),
                roleName: roleDescriptorMap.get(member.role)?.name,
                roleDescription: roleDescriptorMap.get(member.role)?.description,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getWorkspaceRoles = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const userId = req.user?._id;

        if (typeof orgId !== 'string' || !userId) {
            res.status(400).json({ success: false, message: 'Organization ID is required' });
            return;
        }

        const requesterMembership = await getActiveMember(orgId, userId.toString());
        if (!requesterMembership) {
            res.status(403).json({ success: false, message: 'Forbidden: Not an active member of this workspace' });
            return;
        }

        const roles = await listWorkspaceAssignableRoles();
        const currentUserCapabilities = await getWorkspaceCapabilitiesForRole(requesterMembership.role);
        const currentUserPermissions = await getPermissionsForRole(requesterMembership.role);

        res.status(200).json({
            success: true,
            message: 'Workspace roles fetched successfully',
            data: {
                roles,
                currentUserCapabilities,
                currentUserPermissions,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId, memberId } = req.params;
        const requesterId = req.user?._id;

        if (typeof orgId !== 'string' || typeof memberId !== 'string' || !requesterId) {
            res.status(400).json({ success: false, message: 'Organization ID and member ID are required' });
            return;
        }

        const organizationObjectId = toObjectId(orgId);
        const memberObjectId = toObjectId(memberId);

        if (!organizationObjectId || !memberObjectId) {
            res.status(400).json({ success: false, message: 'Invalid organization ID or member ID' });
            return;
        }

        const canManageWorkspace = await hasAdminPrivileges(organizationObjectId.toString(), requesterId.toString());

        if (!canManageWorkspace) {
            res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
            return;
        }

        const member = await OrganizationMember.findOneAndDelete({
            organization: organizationObjectId,
            user: memberObjectId
        }).populate('user', 'name email username avatar');

        if (!member) {
            res.status(404).json({ success: false, message: 'Member not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            data: member
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getWorkspaceBilling = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const organization = await Organization.findById(orgId);

        if (!organization) {
            res.status(404).json({ success: false, message: 'Organization not found' });
            return;
        }

        const memberCount = await OrganizationMember.countDocuments({ organization: organization._id, status: 'active' });

        res.status(200).json({
            success: true,
            data: {
                plan: organization.plan || 'free',
                status: (organization as any).subscriptionStatus === 'active' ? 'active' : (organization as any).subscriptionStatus === 'suspended' ? 'canceled' : 'trialing',
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                seats: 15,
                usedSeats: memberCount,
                cardLast4: '4242',
                cardBrand: 'Visa'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const updateWorkspacePlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orgId } = req.params;
        const { plan } = req.body;

        if (!plan || !['free', 'pro', 'business', 'enterprise'].includes(plan)) {
            res.status(400).json({ success: false, message: 'Invalid or missing subscription plan' });
            return;
        }

        const organization = await Organization.findById(orgId);

        if (!organization) {
            res.status(404).json({ success: false, message: 'Organization not found' });
            return;
        }

        organization.plan = plan;
        if (organization.subscriptionStatus === 'suspended') {
            organization.subscriptionStatus = 'active';
        }
        await organization.save();

        const memberCount = await OrganizationMember.countDocuments({ organization: organization._id, status: 'active' });

        res.status(200).json({
            success: true,
            message: `Workspace plan successfully updated to ${plan}`,
            data: {
                plan: organization.plan,
                status: (organization as any).subscriptionStatus === 'active' ? 'active' : (organization as any).subscriptionStatus === 'suspended' ? 'canceled' : 'trialing',
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                seats: 15,
                usedSeats: memberCount,
                cardLast4: '4242',
                cardBrand: 'Visa'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};
