export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_UPDATED';

export interface NotificationUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Notification {
  _id: string;

  recipient: string;

  sender: NotificationUser | string;

  type: NotificationType;

  title: string;

  message: string;

  entityType: string;

  entityId: string;

  projectId?: string;

  isRead: boolean;

  isDeleted: boolean;

  createdAt: string;

  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
}
export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}
