export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Task {
  _id: string;
  project:
    | string
    | {
        _id: string;
        name: string;
      };
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string | TaskUser | null;
  createdBy?: string | TaskUser;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
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

export interface TaskResponse {
  success: boolean;
  message: string;
  data: Task;
}
