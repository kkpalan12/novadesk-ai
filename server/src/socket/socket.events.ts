export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  JOIN: "join",
  LEAVE: "leave",

  NOTIFICATION: "notification",

  TASK_CREATED: "task-created",
  TASK_UPDATED: "task-updated",
  TASK_ASSIGNED: "task-assigned",
  TASK_DELETED: "task-deleted",

  COMMENT_ADDED: "comment-added",

  PROJECT_CREATED: "project-created",
  PROJECT_UPDATED: "project-updated",

  WORKSPACE_UPDATED: "workspace-updated",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
