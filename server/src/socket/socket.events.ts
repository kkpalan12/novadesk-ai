export const SOCKET_EVENTS = {
  // =========================================
  // CONNECTION
  // =========================================

  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // =========================================
  // GENERIC
  // =========================================

  JOIN: "join",
  LEAVE: "leave",

  // =========================================
  // NOTIFICATIONS
  // =========================================

  NOTIFICATION: "notification",
  NOTIFICATION_COUNT: "notification-count",

  // =========================================
  // TASKS
  // =========================================

  TASK_CREATED: "task-created",
  TASK_UPDATED: "task-updated",
  TASK_ASSIGNED: "task-assigned",
  TASK_DELETED: "task-deleted",
  TASK_STATUS_CHANGED: "task-status-changed",

  // =========================================
  // COMMENTS
  // =========================================

  COMMENT_ADDED: "comment-added",

  // =========================================
  // PROJECTS
  // =========================================

  PROJECT_CREATED: "project:created",

  PROJECT_UPDATED: "project:updated",

  // =========================================
  // WORKSPACE
  // =========================================

  WORKSPACE_UPDATED: "workspace:updated",

  // =========================================
  // PRESENCE
  // =========================================

  USER_ONLINE: "user-online",

  USER_OFFLINE: "user-offline",

  ONLINE_USERS: "online-users",

  // =========================================
  // PROJECT ROOMS
  // =========================================

  JOIN_PROJECT: "join-project",

  LEAVE_PROJECT: "leave-project",

  // =========================================
  // WORKSPACE ROOMS
  // =========================================

  JOIN_WORKSPACE: "join-workspace",

  LEAVE_WORKSPACE: "leave-workspace",

  // =========================================
  // ACTIVITY
  // =========================================

  ACTIVITY_CREATED: "activity:created",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
