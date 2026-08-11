export interface DashboardTaskSummary {
  total: number;
  TODO: number;
  IN_PROGRESS: number;
  REVIEW: number;
  DONE: number;
}

export interface DashboardPrioritySummary {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface DashboardData {
  tasks: DashboardTaskSummary;
  priorities: DashboardPrioritySummary;
  myTasks: unknown[];
  recentActivities: unknown[];
  unreadNotifications: number;
}
