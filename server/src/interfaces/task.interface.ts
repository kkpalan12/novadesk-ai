import { Document, Types } from "mongoose";

export interface ITask extends Document {
  project: Types.ObjectId;

  title: string;

  description?: string;

  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  assignedTo?: Types.ObjectId;

  createdBy: Types.ObjectId;

  dueDate?: Date;

  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
