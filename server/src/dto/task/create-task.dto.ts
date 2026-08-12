import { TASK_PRIORITY } from "../../common/constants/task.constants";

export interface CreateTaskDto {
  project: string;

  title: string;

  description?: string;

  status?: string;

  priority?: (typeof TASK_PRIORITY)[number];

  assignedTo?: string;

  dueDate?: Date;
}
