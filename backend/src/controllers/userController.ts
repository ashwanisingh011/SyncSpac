import { Request, Response } from 'express';
import User from '../models/User.js';

/**
 * @desc    Upload user profile avatar
 * @route   PATCH /api/uploads/avatar
 */
export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image file provided.' });
            return;
        }
        const imageUrl = req.file.path;

        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            { avatar: imageUrl },
            { new: true, runValidators: true }
        ).select('-password -twoFactorOTP');

        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            data: updatedUser
        });

    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
};

/**
 * @desc    Update user profile details
 * @route   PATCH /api/users/profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, phoneNumber, designation } = req.body;
        
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (designation !== undefined) updateData.designation = designation;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -twoFactorOTP');

        if (!updatedUser) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error during profile update' });
    }
};

/**
 * @desc    Get current user profile (always fresh from DB)
 * @route   GET /api/users/profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?._id).select(
            '-password -twoFactorOTP -emailChangeToken -emailChangeTokenExpire -verificationToken -verificationTokenExpire'
        );

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};