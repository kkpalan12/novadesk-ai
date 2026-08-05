export const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "TASK_UPDATED",
  "TASK_COMPLETED",
  "COMMENT_ADDED",
  "PROJECT_CREATED",
  "WORKSPACE_INVITATION",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
