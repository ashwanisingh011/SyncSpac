import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Notification from '../models/Notification.js';

/**
 * @desc    Fetch paginated notifications for the authenticated user
 * @route   GET /api/notifications?page=1&limit=20
 */
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication is required.',
        data: null,
      });
      return;
    }

    const recipientId = req.user._id;

    // Parse query params with fallback defaults for pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    // Fetch matching notifications and total count in parallel for optimization
    const [notifications, totalNotifications] = await Promise.all([
      Notification.find({ recipient: recipientId })
        .populate('sender', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: recipientId }),
    ]);

    const totalPages = Math.ceil(totalNotifications / limit);

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalPages,
          totalNotifications,
        },
      },
    });
  } catch (error) {
    // Securely log the raw error to the server console for developers/admin
    console.error('Error in getMyNotifications controller:', error);
    // Mask the 500 error block to prevent information disclosure vulnerabilities
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

/**
 * @desc    Mark a specific notification as read after validating owner authentication
 * @route   PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication is required.',
        data: null,
      });
      return;
    }

    const id = req.params.id;
    if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid notification ID format.',
        data: null,
      });
      return;
    }

    const notificationId = new Types.ObjectId(id);
    const recipientId = req.user._id;

    // Find the notification and verify ownership before modifying
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: recipientId,
    });

    if (!notification) {
      // Securely return 404 to prevent resource enumeration/unauthorized disclosure
      res.status(404).json({
        success: false,
        message: 'Notification not found',
        data: null,
      });
      return;
    }

    // Only update if it is currently unread
    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully',
      data: notification,
    });
  } catch (error) {
    console.error('Error in markAsRead controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};

/**
 * @desc    Mark all unread notifications of the user as read using a single batch query
 * @route   PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication is required.',
        data: null,
      });
      return;
    }

    const recipientId = req.user._id;

    // Perform a single batch update using updateMany
    const result = await Notification.updateMany(
      { recipient: recipientId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read successfully',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error in markAllAsRead controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  }
};
