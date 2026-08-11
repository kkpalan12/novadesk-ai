import { Types } from "mongoose";

export class TaskEntity {
  project: Types.ObjectId;

  title: string;

  description?: string;

  createdBy: Types.ObjectId;

  assignedTo?: Types.ObjectId;

  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

  dueDate?: Date;

  isDeleted: boolean;

  constructor(data: {
    project: string;

    title: string;

    description?: string;

    createdBy: string;

    assignedTo?: string;

    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

    dueDate?: Date;
  }) {
    this.project = new Types.ObjectId(data.project);

    this.title = data.title;

    this.description = data.description ?? "";

    this.createdBy = new Types.ObjectId(data.createdBy);

    this.assignedTo = data.assignedTo
      ? new Types.ObjectId(data.assignedTo)
      : undefined;

    this.priority = data.priority ?? "MEDIUM";

    this.status = "TODO";

    this.dueDate = data.dueDate;

    this.isDeleted = false;
  }
}
