export interface CreateTaskDto {
  project: string;

  title: string;

  description?: string;

  status?: string;

  priority?: string;

  assignedTo?: string;

  dueDate?: string;
}
