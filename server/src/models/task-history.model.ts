import mongoose, { Schema } from "mongoose";

import { ITaskHistory } from "../interfaces/task-history.interface";

const taskHistorySchema = new Schema<ITaskHistory>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    action: {
      type: String,
      enum: ["CREATED", "UPDATED", "STATUS_CHANGED", "ASSIGNED", "DELETED"],
      required: true,
    },

    oldValue: {
      type: String,
    },

    newValue: {
      type: String,
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Indexes
 */
taskHistorySchema.index({
  task: 1,
  createdAt: -1,
});

taskHistorySchema.index({
  performedBy: 1,
});

taskHistorySchema.index({
  createdAt: -1,
});

export const TaskHistory = mongoose.model<ITaskHistory>(
  "TaskHistory",
  taskHistorySchema,
);
