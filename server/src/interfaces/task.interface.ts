import { Document, Types } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ITask extends Document {
  title: string;

  description: string;

  status: TaskStatus;

  priority: TaskPriority;

  dueDate?: Date;

  assignedTo?: Types.ObjectId;

  createdBy: Types.ObjectId;

  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
