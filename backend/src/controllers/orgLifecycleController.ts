import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Organization from '../models/Organization.js';
import OrganizationMember, { OrgRole } from '../models/OrganizationMember.js';
import WorkspaceSettings from '../models/WorkspaceSettings.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import { UserRole } from '../types/roles.js';

// Configuration Constants
const INVITATION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * @desc    Allows an ORG_ADMIN to initialize a new Organization workspace
 * @route   POST /api/org-lifecycle/create
 * @access  Private (Org Admin)
 */
export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name } = req.body;
    const userId = req.user?._id;

    if (!name) {
      res.status(400).json({ success: false, message: 'Organization name is required' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // 1. Create Organization (using array syntax for transaction sessions in Mongoose)
    const [organization] = await Organization.create([{
      name,
      owner: userId
    }], { session });

    // 2. Create Owner Member Record
    await OrganizationMember.create([{
      organization: organization._id,
      user: userId,
      role: OrgRole.OWNER,
      status: 'active',
      joinedAt: new Date()
    }], { session });

    // 3. Initialize Workspace Settings
    await WorkspaceSettings.create([{
      organization: organization._id,
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      timezone: 'UTC',
      language: 'en'
    }], { session });

    // 4. Update user's active organization field and push to organizations list
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { organization: organization._id },
        $addToSet: { organizations: organization._id }
      },
      { new: true, session }
    ).select('-password');

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: {
        organization,
        user: updatedUser
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in createOrganization:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Generates a secure, cryptographically random team member invitation token
 * @route   POST /api/org-lifecycle/invite
 * @access  Private (Org Admin)
 */
export const inviteTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, organizationId } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const orgId = organizationId || req.user?.organization;

    if (!orgId) {
      res.status(400).json({ success: false, message: 'Organization ID is required' });
      return;
    }

    // Verify organization exists
    const organization = await Organization.findById(orgId);
    if (!organization) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    // Verify requester has OWNER or ADMIN access to the organization
    const membership = await OrganizationMember.findOne({
      organization: orgId,
      user: req.user?._id,
      status: 'active',
      role: { $in: [OrgRole.OWNER, OrgRole.ADMIN] }
    });

    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions to invite team members to this organization.'
      });
      return;
    }

    // Prevent duplicate active membership for this user/org combination
    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (targetUser) {
      const existingMember = await OrganizationMember.findOne({
        organization: orgId,
        user: targetUser._id
      });
      if (existingMember && existingMember.status === 'active') {
        res.status(400).json({
          success: false,
          message: 'User is already an active member of this organization.'
        });
        return;
      }
    }

    // Generate secure, cryptographically random token string
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRATION_MS);

    const invitation = await Invitation.create({
      email: email.toLowerCase().trim(),
      organization: orgId,
      token,
      invitedBy: req.user?._id,
      status: 'pending',
      expiresAt
    });

    res.status(201).json({
      success: true,
      message: 'Invitation generated successfully',
      data: {
        id: invitation._id,
        email: invitation.email,
        organization: invitation.organization,
        token,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error in inviteTeamMember:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Endpoint used by standard MEMBER to accept and validate invitation token
 * @route   POST /api/org-lifecycle/accept-invite/:token
 * @access  Private (Member)
 */
export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ success: false, message: 'Invitation token is required' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const invitation = await Invitation.findOne({ token }).session(session);

    if (!invitation) {
      res.status(404).json({ success: false, message: 'Invitation not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}.`
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save({ session });
      res.status(400).json({ success: false, message: 'This invitation has expired.' });
      await session.commitTransaction();
      session.endSession();
      return;
    }

    // Strict constraint: logged in user must own the email associated with the token
    if (req.user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      res.status(403).json({
        success: false,
        message: 'This invitation was sent to a different email address.'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // 1. Update Invitation State
    invitation.status = 'accepted';
    await invitation.save({ session });

    // 2. Add Organization reference to User's profile array and activate organization directly
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { organization: invitation.organization },
        $addToSet: { organizations: invitation.organization }
      },
      { new: true, session }
    ).select('-password');

    // 3. Upsert OrganizationMember relationship to active status
    await OrganizationMember.findOneAndUpdate(
      { organization: invitation.organization, user: req.user?._id },
      {
        role: OrgRole.MEMBER,
        status: 'active',
        joinedAt: new Date()
      },
      { upsert: true, new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully. Welcome to the workspace!',
      data: {
        organizationId: invitation.organization,
        user: updatedUser
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in acceptInvitation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
