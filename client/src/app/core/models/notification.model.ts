export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | string;

export interface NotificationUser {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  user?: NotificationUser | string;
  task?: string;
  project?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
}
