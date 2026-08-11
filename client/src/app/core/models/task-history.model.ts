export interface TaskHistoryUser {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface TaskHistory {
  _id: string;
  task: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  performedBy?: TaskHistoryUser | string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskHistoryResponse {
  success: boolean;
  message: string;
  data: TaskHistory[];
}
