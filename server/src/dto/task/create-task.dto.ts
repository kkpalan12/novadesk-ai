export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate?: Date;
  assignedTo?: string;
}