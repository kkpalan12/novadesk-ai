import { NotFoundError } from "../common/errors/NotFoundError";

import { CreateNotificationDto } from "../dto/notification/create-notification.dto";

import { NotificationRepository } from "../repositories/notification.repository";
import { TaskRepository } from "../repositories/task.repository";

import { SocketService } from "../socket/socket.service";

import { ENTITY_TYPES } from "../common/constants/entity.constants";
import { logger } from "../common/logger";

export class NotificationService {
  private readonly repository = new NotificationRepository();

  private readonly socketService = new SocketService();

  private readonly taskRepository = new TaskRepository();

  /**
   * Create Notification
   *
   * Internal use only.
   */
  async create(dto: CreateNotificationDto) {
    const notification = await this.repository.create(dto);

    logger.debug(
      {
        notificationId: notification._id,
      },
      "Notification created",
    );

    this.socketService.sendNotification(dto.recipient, notification);

    const count = await this.repository.countUnread(dto.recipient);

    this.socketService.sendUnreadCount(dto.recipient, count);

    return notification;
  }

  /**
   * Get logged-in user's notifications.
   */
  async getMyNotifications(userId: string) {
    const notifications = await this.repository.findByRecipient(userId);

    return Promise.all(
      notifications.map((notification) =>
        this.addNavigationContext(notification),
      ),
    );
  }

  /**
   * Mark notification as read.
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.repository.markAsRead(id, userId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    const count = await this.repository.countUnread(userId);

    this.socketService.sendUnreadCount(userId, count);

    return notification;
  }

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);

    this.socketService.sendUnreadCount(userId, 0);

    return {
      count: 0,
    };
  }

  /**
   * Delete notification.
   */
  async delete(id: string, userId: string) {
    const notification = await this.repository.softDelete(id, userId);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    return notification;
  }

  /**
   * Get unread notification count.
   */
  async getUnreadCount(userId: string) {
    const count = await this.repository.countUnread(userId);

    return {
      count,
    };
  }

  /**
   * Notify task assigned.
   */
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

  /**
   * Notify comment added.
   */
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

  /**
   * Notify task status changed.
   */
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
      entityType: ENTITY_TYPES.TASK,
      entityId: data.taskId,
    });
  }

  /**
   * Notify task updated.
   */
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
      taskId: data.taskId,
      type: "TASK_UPDATED",
      title: "Task Updated",
      message: `"${data.taskTitle}" moved to ${data.status}.`,
      entityType: ENTITY_TYPES.TASK,
      entityId: data.taskId,
    } as CreateNotificationDto);
  }

  /**
   * Add navigation context to task notifications.
   */
  private async addNavigationContext(notification: any) {
    const result = notification.toObject?.() ?? notification;

    if (result.entityType?.toLowerCase() !== "task" || !result.entityId) {
      return result;
    }

    const task = await this.taskRepository.findById(result.entityId);

    if (!task) {
      return result;
    }

    return {
      ...result,
      projectId: this.getObjectId(task.project),
    };
  }

  /**
   * Resolve ObjectId from populated/unpopulated value.
   */
  private getObjectId(value: any): string {
    if (value && typeof value === "object" && "_id" in value) {
      return String(value._id);
    }

    return String(value);
  }
}
