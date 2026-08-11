export interface ActivityUser {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Activity {
  _id: string;
  workspace: string;
  project?: string;
  task?: string;
  user?: ActivityUser | string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityResponse {
  success: boolean;
  message: string;
  data: {
    activities: Activity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
