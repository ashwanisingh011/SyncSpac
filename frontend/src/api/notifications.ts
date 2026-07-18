import api from './axios';

export type NotificationType =
  | 'INVITATION_RECEIVED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'COMMENT_ADDED'
  | 'PROJECT_UPDATED';

export interface INotification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity: string;
  entityModel: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type INotificationData = INotification;

export interface INotificationsResponse {
  notifications: INotification[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalNotifications: number;
  };
}

export const getMyNotifications = async (
  page: number = 1,
  limit: number = 20
): Promise<INotificationsResponse> => {
  const { data } = await api.get('/notifications', {
    params: { page, limit }
  });
  return data.data;
};

export const getNotifications = async (): Promise<INotification[]> => {
  const { data } = await api.get('/notifications');
  return data.data.notifications || [];
};

export const markNotificationRead = async (notificationId: string): Promise<INotification> => {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data.data;
};

export const markNotificationAsRead = markNotificationRead;

export const markAllNotificationsRead = async (): Promise<any> => {
  const { data } = await api.patch('/notifications/read-all');
  return data.data;
};

export const markAllNotificationsAsRead = markAllNotificationsRead;
