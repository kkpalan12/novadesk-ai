export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate?: Date;
  assignedTo?: string;
}
