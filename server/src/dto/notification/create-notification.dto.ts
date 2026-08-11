import { NotificationType } from "../../common/constants/notification.constants";

export interface CreateNotificationDto {
  recipient: string;

  sender: string;

  type: NotificationType;

  title: string;

  message: string;

  entityType: string;

  entityId: string;
}
