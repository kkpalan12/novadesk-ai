import { NotFoundError } from "../common/errors/NotFoundError";
import { CreateNotificationDto } from "../dto/notification/create-notification.dto";
import { NotificationRepository } from "../repositories/notification.repository";
import { SocketService } from "../socket/socket.service";
import { ENTITY_TYPES } from "../common/constants/entity.constants";

export class NotificationService {
  private readonly repository = new NotificationRepository();
  private readonly socketService = new SocketService();

  async create(dto: CreateNotificationDto) {
    console.log("📤 Creating notification:", dto);
    const notification = await this.repository.create(dto);

    this.socketService.sendNotification(dto.recipient, notification);

    const count = await this.repository.countUnread(dto.recipient);

    this.socketService.sendUnreadCount(dto.recipient, count);

    return notification;
  }

  async getMyNotifications(userId: string) {
    return this.repository.findByRecipient(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.repository.findById(id);

    if (notification) {
      const count = await this.repository.countUnread(
        notification.recipient.toString(),
      );

      this.socketService.sendUnreadCount(
        notification.recipient.toString(),
        count,
      );
    }
  }
  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);

    // Update badge count in real time
    this.socketService.sendUnreadCount(userId, 0);

    return {
      count: 0,
    };
  }

  async delete(id: string, userId: string) {
    const notification = await this.repository.softDelete(id, userId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    return notification;
  }
  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    const count = await this.repository.countUnread(userId);

    return {
      count,
    };
  }
  async notifyTaskAssigned(data: {
    recipient: string;
    sender: string;
    taskId: string;
    taskTitle: string;
  }) {
    return this.create({
      recipient: data.recipient,
      sender: data.sender,
      type: "TASK_ASSIGNED",
      title: "Task Assigned",
      message: `You have been assigned "${data.taskTitle}".`,
      entityType: ENTITY_TYPES.TASK,
      entityId: data.taskId,
    });
  }
  async notifyCommentAdded(data: {
    recipient: string;
    sender: string;
    taskId: string;
    taskTitle: string;
    commenterName: string;
  }) {
    return this.create({
      recipient: data.recipient,
      sender: data.sender,
      type: "COMMENT_ADDED",
      title: "New Comment",
      message: `${data.commenterName} commented on "${data.taskTitle}".`,
      entityType: ENTITY_TYPES.TASK,
      entityId: data.taskId,
    });
  }
  async notifyTaskStatusChanged(data: {
    recipient: string;
    sender: string;
    taskId: string;
    taskTitle: string;
    status: string;
  }) {
    return this.create({
      recipient: data.recipient,
      sender: data.sender,
      type: "TASK_STATUS_CHANGED",
      title: "Task Updated",
      message: `"${data.taskTitle}" status changed to ${data.status}.`,
      entityType: "Task",
      entityId: data.taskId,
    });
  }
  async notifyTaskUpdated(data: {
    recipient: string;
    sender: string;
    taskId: string;
    taskTitle: string;
    status: string;
  }) {
    return this.create({
      recipient: data.recipient,
      sender: data.sender,
      type: "TASK_UPDATED",
      title: "Task Updated",
      message: `"${data.taskTitle}" moved to ${data.status}.`,
      entityType: ENTITY_TYPES.TASK,
      entityId: data.taskId,
    });
  }
}
