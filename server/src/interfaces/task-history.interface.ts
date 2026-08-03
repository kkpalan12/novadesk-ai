import { Document, Types } from "mongoose";

export type TaskAction =
  "CREATED" | "UPDATED" | "STATUS_CHANGED" | "ASSIGNED" | "DELETED";

export interface ITaskHistory extends Document {
  task: Types.ObjectId;

  action: TaskAction;

  oldValue?: string;

  newValue?: string;

  performedBy: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
