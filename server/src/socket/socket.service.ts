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

      console.log("🔔 Sending notification to:", `user:${userId}`);

      io.to(`user:${userId}`).emit("notification:new", notification);

      console.log("✅ notification:new emitted");
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping notification.", error);
    }
  }

  sendUnreadCount(userId: string, count: number) {
    try {
      const io = getIO();

      console.log(
        "🔔 Sending unread count to:",
        `user:${userId}`,
        "count:",
        count,
      );

      io.to(`user:${userId}`).emit("notification:unread-count", {
        count,
      });

      console.log("✅ notification:unread-count emitted");
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping unread count.", error);
    }
  }
}
