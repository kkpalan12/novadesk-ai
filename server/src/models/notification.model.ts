import { Schema, model } from "mongoose";
import { NOTIFICATION_TYPES } from "../common/constants/notification.constants";

const notificationSchema = new Schema(
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

export const Notification = model("Notification", notificationSchema);
