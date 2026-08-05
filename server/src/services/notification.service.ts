import { NotFoundError } from "../common/errors/NotFoundError";
import { CreateNotificationDto } from "../dto/notification/create-notification.dto";
import { NotificationRepository } from "../repositories/notification.repository";

export class NotificationService {
  private readonly repository = new NotificationRepository();

  async create(dto: CreateNotificationDto) {
    return this.repository.create(dto);
  }

  async getMyNotifications(userId: string) {
    return this.repository.findByRecipient(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.repository.markAsRead(id, userId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }

  async delete(id: string, userId: string) {
    const notification = await this.repository.softDelete(id, userId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    return notification;
  }
  async getUnreadCount(userId: string) {
    return this.repository.getUnreadCount(userId);
  }
}
