import { TaskPriority, TaskStatus } from "../interfaces/task.interface";

export class TaskEntity {
  title: string;

  description: string;

  priority: TaskPriority;

  status: TaskStatus;

  dueDate?: Date;

  assignedTo?: string;

  createdBy: string;

  isDeleted: boolean;

  constructor(data: {
    title: string;

    description?: string;

    priority?: TaskPriority;

    dueDate?: Date;

    assignedTo?: string;

    createdBy: string;
  }) {
    this.title = data.title;

    this.description = data.description ?? "";

    this.priority = data.priority ?? "MEDIUM";

    this.status = "TODO";

    this.dueDate = data.dueDate;

    this.assignedTo = data.assignedTo;

    this.createdBy = data.createdBy;

    this.isDeleted = false;
  }
}
