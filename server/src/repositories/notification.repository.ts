import { Notification } from "../models/notification.model";
import { CreateNotificationDto } from "../dto/notification/create-notification.dto";

export class NotificationRepository {
  async create(dto: CreateNotificationDto) {
    return Notification.create(dto);
  }

  async findByRecipient(recipient: string) {
    return Notification.find({
      recipient,
      isDeleted: false,
    })
      .populate("sender", "firstName lastName email")
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return Notification.findOne({
      _id: id,
      isDeleted: false,
    });
  }

  async markAsRead(id: string, recipient: string) {
    return Notification.findOneAndUpdate(
      {
        _id: id,
        recipient,
        isDeleted: false,
      },
      {
        isRead: true,
      },
      {
        new: true,
      },
    );
  }

  async markAllAsRead(recipient: string) {
    return Notification.updateMany(
      {
        recipient,
        isDeleted: false,
      },
      {
        isRead: true,
      },
    );
  }

  async softDelete(id: string, recipient: string) {
    return Notification.findOneAndUpdate(
      {
        _id: id,
        recipient,
        isDeleted: false,
      },
      {
        isDeleted: true,
      },
      {
        new: true,
      },
    );
  }
  async getUnreadCount(recipient: string) {
    return Notification.countDocuments({
      recipient,
      isRead: false,
      isDeleted: false,
    });
  }
}
