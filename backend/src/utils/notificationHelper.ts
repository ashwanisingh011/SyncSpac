import { Types } from 'mongoose';
import Notification, { INotification } from '../models/Notification.js';

export type NotificationType =
  | 'INVITATION_RECEIVED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'COMMENT_ADDED'
  | 'PROJECT_UPDATED';

export type NotificationEntityModel = 'Task' | 'Project' | 'Organization' | 'Invitation';

export interface CreateNotificationParams {
  recipient: Types.ObjectId | string;
  sender?: Types.ObjectId | string | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity: Types.ObjectId | string;
  entityModel: NotificationEntityModel;
}

const emitNotification = async (notification: { recipient: Types.ObjectId | string }): Promise<void> => {
  try {
    const { getIO } = await import('../config/socket.js');
    getIO().to(notification.recipient.toString()).emit('notification:received', notification);
  } catch {
    // Socket server may not be initialized in tests or background scripts.
  }
}

/**
 * Creates an in-app notification securely and asynchronously.
 * Any errors encountered during creation are logged but do not crash the caller context.
 *
 * @param params Object matching the Notification schema requirements
 * @returns The created INotification document or null if creation failed
 */
export const createNotification = async (
  params: CreateNotificationParams
): Promise<INotification | null> => {
  try {
    const notification = await Notification.create({
      ...params,
      isRead: false,
    });

    await emitNotification(notification);

    return notification;
  } catch (error) {
    // Securely log the internal server error to the server console
    console.error('Failed to create notification inside helper:', error);
    return null;
  }
};

export const createNotifications = async (
  params: CreateNotificationParams[]
): Promise<INotification[]> => {
  try {
    if (params.length === 0) return [];

    const notifications = await Notification.insertMany(
      params.map((notification) => ({
        ...notification,
        isRead: false,
      }))
    ) as INotification[];

    await Promise.all(notifications.map((notification) => emitNotification(notification)));

    return notifications;
  } catch (error) {
    console.error('Failed to create notifications inside helper:', error);
    return [];
  }
};
