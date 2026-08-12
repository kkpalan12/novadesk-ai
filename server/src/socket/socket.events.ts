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

  NOTIFICATION: "notification:new",
  NOTIFICATION_COUNT: "notification:unread-count",

  // =========================================
  // TASKS
  // =========================================

  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_ASSIGNED: "task:assigned",
  TASK_DELETED: "task:deleted",
  TASK_STATUS_CHANGED: "task:status-changed",

  // =========================================
  // COMMENTS
  // =========================================

  COMMENT_CREATED: "comment:created",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",

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
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
