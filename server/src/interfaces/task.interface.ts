import { Document, Types } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;

  status:
    | "TODO"
    | "IN_PROGRESS"
    | "REVIEW"
    | "DONE";

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  dueDate?: Date;

  assignedTo?: Types.ObjectId;

  createdBy: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
export interface CreateTaskData {
    title: string;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    dueDate?: Date;
    assignedTo?: string;
    createdBy: string;
}