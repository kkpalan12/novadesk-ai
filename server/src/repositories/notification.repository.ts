import { ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { Notification } from "../models/notification.model";
import { CreateNotificationDto } from "../dto/notification/create-notification.dto";

export class NotificationRepository extends BaseRepository<any> {
  constructor() {
    super(Notification);
  }

  /**
   * Create Notification
   */
  async create(dto: CreateNotificationDto, session?: ClientSession) {
    return super.create(dto, session);
  }

  /**
   * Get Notifications For Recipient
   */
  async findByRecipient(recipient: string) {
    return this.model
      .find({
        recipient,
        isDeleted: false,
      })
      .populate("sender", "firstName lastName email")
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  /**
   * Find Notification By Id
   */
  async findById(id: string) {
    return this.model
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate("sender", "firstName lastName email")
      .exec();
  }

  /**
   * Mark Notification As Read
   */
  async markAsRead(id: string, recipient: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
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
          session,
        },
      )
      .populate("sender", "firstName lastName email")
      .exec();
  }

  /**
   * Mark All Notifications As Read
   */
  async markAllAsRead(recipient: string, session?: ClientSession) {
    return this.model
      .updateMany(
        {
          recipient,
          isDeleted: false,
          isRead: false,
        },
        {
          isRead: true,
        },
        {
          session,
        },
      )
      .exec();
  }

  /**
   * Soft Delete Notification
   */
  async softDelete(id: string, recipient: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
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
          session,
        },
      )
      .exec();
  }

  /**
   * Get Unread Notification Count
   */
  async getUnreadCount(recipient: string) {
    return this.model
      .countDocuments({
        recipient,
        isRead: false,
        isDeleted: false,
      })
      .exec();
  }

  /**
   * Count Unread Notifications
   *
   * Kept as an alias for existing service callers.
   */
  async countUnread(recipient: string) {
    return this.model
      .countDocuments({
        recipient,
        isRead: false,
        isDeleted: false,
      })
      .exec();
  }
}
