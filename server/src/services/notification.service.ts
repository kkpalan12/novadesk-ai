import { NotFoundError } from "../common/errors/NotFoundError";
import { CreateNotificationDto } from "../dto/notification/create-notification.dto";
import { NotificationRepository } from "../repositories/notification.repository";
import { SocketService } from "../socket/socket.service";

export class NotificationService {
  private readonly repository = new NotificationRepository();
  private readonly socketService = new SocketService();

  async create(dto: CreateNotificationDto) {
    console.log("📤 Creating notification:", dto);

    const notification = await this.repository.create(dto);

    console.log("✅ Notification saved:", notification._id);

    this.socketService.sendNotification(dto.recipient, notification);

    return notification;
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
