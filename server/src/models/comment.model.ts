import { Schema, model, Document, Types } from "mongoose";

export interface IComment extends Document {
  task: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isEdited: {
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
commentSchema.index({
  task: 1,
  createdAt: -1,
});

commentSchema.index({
  task: 1,
  isDeleted: 1,
  createdAt: -1,
});

commentSchema.index({
  createdBy: 1,
});

export const Comment = model<IComment>("Comment", commentSchema);
