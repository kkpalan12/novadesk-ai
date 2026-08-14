import { ClientSession, Types } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { Notification, INotification } from "../models/notification.model";

import { CreateNotificationDto } from "../dto/notification/create-notification.dto";

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  /**
   * Create Notification
   *
   * BaseRepository-compatible signature.
   */
  async create(
    data: Partial<INotification>,
    session?: ClientSession,
  ): Promise<INotification>;

  /**
   * DTO-compatible signature.
   */
  async create(
    data: CreateNotificationDto,
    session?: ClientSession,
  ): Promise<INotification>;

  /**
   * Create Notification
   */
  async create(
    data: Partial<INotification> | CreateNotificationDto,
    session?: ClientSession,
  ): Promise<INotification> {
    const normalizedData: Partial<INotification> = {};

    if ("recipient" in data && data.recipient !== undefined) {
      normalizedData.recipient =
        typeof data.recipient === "string"
          ? new Types.ObjectId(data.recipient)
          : data.recipient;
    }

    if ("sender" in data && data.sender !== undefined) {
      normalizedData.sender =
        typeof data.sender === "string"
          ? new Types.ObjectId(data.sender)
          : data.sender;
    }

    if ("type" in data && data.type !== undefined) {
      normalizedData.type = data.type;
    }

    if ("title" in data && data.title !== undefined) {
      normalizedData.title = data.title;
    }

    if ("message" in data && data.message !== undefined) {
      normalizedData.message = data.message;
    }

    if ("entityType" in data && data.entityType !== undefined) {
      normalizedData.entityType = data.entityType;
    }

    if ("entityId" in data && data.entityId !== undefined) {
      normalizedData.entityId =
        typeof data.entityId === "string"
          ? new Types.ObjectId(data.entityId)
          : data.entityId;
    }

    if ("isRead" in data && data.isRead !== undefined) {
      normalizedData.isRead = data.isRead;
    }

    if ("isDeleted" in data && data.isDeleted !== undefined) {
      normalizedData.isDeleted = data.isDeleted;
    }

    return super.create(normalizedData, session);
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
