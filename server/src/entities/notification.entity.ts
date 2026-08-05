import { NotificationType } from "../common/constants/notification.constants";

export interface NotificationEntity {
  _id?: string;

  recipient: string;

  sender: string;

  type: NotificationType;

  title: string;

  message: string;

  entityType: string;

  entityId: string;

  isRead: boolean;

  isDeleted: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}
