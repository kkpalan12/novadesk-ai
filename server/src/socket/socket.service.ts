import { getIO } from "./index";
import { SOCKET_EVENTS } from "./socket.events";

export class SocketService {
  sendNotification(userId: string, notification: unknown) {
    console.log("📡 Emitting to room:", userId);

    getIO().to(userId).emit(SOCKET_EVENTS.NOTIFICATION, notification);
  }

  /**
   * Broadcast task update to everyone viewing a project
   */
  sendTaskUpdate(projectId: string, task: unknown) {
    getIO().to(`project:${projectId}`).emit(SOCKET_EVENTS.TASK_UPDATED, task);
  }

  sendTaskAssignment(userId: string, task: unknown) {
    getIO().to(userId).emit(SOCKET_EVENTS.TASK_ASSIGNED, task);
  }

  sendComment(userId: string, comment: unknown) {
    getIO().to(userId).emit(SOCKET_EVENTS.COMMENT_ADDED, comment);
  }

  broadcast(event: string, data: unknown) {
    getIO().emit(event, data);
  }
  sendTaskStatusUpdate(projectId: string, task: unknown) {
    getIO().to(`project:${projectId}`).emit(SOCKET_EVENTS.TASK_UPDATED, task);
  }
  /**
   * Update notification badge
   */
  sendUnreadCount(userId: string, count: number) {
    getIO().to(userId).emit("notification-count", {
      count,
    });
  }
  /**
   * Broadcast task deletion
   */
  sendTaskDeleted(projectId: string, taskId: string) {
    getIO().to(`project:${projectId}`).emit(SOCKET_EVENTS.TASK_DELETED, {
      taskId,
    });
  }
}
