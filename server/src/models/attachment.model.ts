import mongoose, { Schema } from "mongoose";

import { IAttachment } from "../interfaces/attachment.interface";

const attachmentSchema = new Schema<IAttachment>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    path: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

attachmentSchema.index({
  task: 1,
});

attachmentSchema.index({
  uploadedBy: 1,
});

export const Attachment = mongoose.model<IAttachment>(
  "Attachment",
  attachmentSchema,
);
