export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  JOIN: "join",
  LEAVE: "leave",

  NOTIFICATION: "notification",
  NOTIFICATION_COUNT: "notification-count",

  TASK_CREATED: "task-created",
  TASK_UPDATED: "task-updated",
  TASK_ASSIGNED: "task-assigned",
  TASK_DELETED: "task-deleted",
  TASK_STATUS_CHANGED: "task-status-changed",

  COMMENT_ADDED: "comment-added",

  PROJECT_CREATED: "project-created",
  PROJECT_UPDATED: "project-updated",

  WORKSPACE_UPDATED: "workspace-updated",

  USER_ONLINE: "user-online",
  USER_OFFLINE: "user-offline",
  ONLINE_USERS: "online-users",

  JOIN_PROJECT: "join-project",
  LEAVE_PROJECT: "leave-project",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
