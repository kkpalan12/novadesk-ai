export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TaskProject {
  _id: string;
  name: string;
}

export interface Task {
  _id: string;

  project: string | TaskProject;

  title: string;

  description?: string;

  status: TaskStatus;

  priority: TaskPriority;

  assignedTo?: string | TaskUser;

  createdBy: string | TaskUser;

  dueDate?: string;

  commentsCount?: number;

  attachmentsCount?: number;

  isDeleted: boolean;

  createdAt?: string;

  updatedAt?: string;
}

export interface TaskResponse {
  success: boolean;
  message: string;
  data: Task;
}

export interface TasksResponse {
  success: boolean;
  message: string;

  data: {
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
