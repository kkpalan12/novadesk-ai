import { getIO } from "./index";

export class SocketService {
  sendTaskUpdate(projectId: string, task: any) {
    try {
      const io = getIO();

      io.to(`project:${projectId}`).emit("task:updated", task);
    } catch {
      console.warn("Socket.IO unavailable. Skipping task update.");
    }
  }

  sendTaskDeleted(projectId: string, taskId: string) {
    try {
      const io = getIO();

      io.to(`project:${projectId}`).emit("task:deleted", {
        taskId,
      });
    } catch {
      console.warn("Socket.IO unavailable. Skipping task deletion.");
    }
  }

  sendNotification(userId: string, notification: any) {
    try {
      const io = getIO();

      io.to(`user:${userId}`).emit("notification:new", notification);
    } catch {
      console.warn("Socket.IO unavailable. Skipping notification.");
    }
  }

  sendUnreadCount(userId: string, count: number) {
    try {
      const io = getIO();

      io.to(`user:${userId}`).emit("notification:unread-count", {
        count,
      });
    } catch {
      console.warn("Socket.IO unavailable. Skipping unread count.");
    }
  }
}
