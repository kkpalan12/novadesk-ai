import mongoose, { Schema } from "mongoose";

import { IAttachment } from "../interfaces/attachment.interface";

const attachmentSchema = new Schema<IAttachment>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: Number,
      required: true,
      min: 0,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

attachmentSchema.index({
  task: 1,
  isDeleted: 1,
});

export const Attachment = mongoose.model<IAttachment>(
  "Attachment",
  attachmentSchema,
);
