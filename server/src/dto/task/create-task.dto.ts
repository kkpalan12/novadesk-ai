export interface CreateTaskDto {
  project: string;

  title: string;

  description?: string;

  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  assignedTo?: string;

  dueDate?: Date;
}
