import { Schema, model, Document, Types } from "mongoose";

import { NOTIFICATION_TYPES } from "../common/constants/notification.constants";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;

  type:
    | "TASK_ASSIGNED"
    | "TASK_UPDATED"
    | "TASK_COMPLETED"
    | "COMMENT_ADDED"
    | "PROJECT_CREATED"
    | "WORKSPACE_INVITATION"
    | "TASK_STATUS_CHANGED";

  title: string;
  message: string;

  entityType: string;
  entityId: Types.ObjectId;

  isRead: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    entityType: {
      type: String,
      required: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Indexes
 */
notificationSchema.index({
  recipient: 1,
  isDeleted: 1,
  isRead: 1,
});

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);
