import { getIO } from "./index";

export class SocketService {
  // =========================================
  // TASK
  // =========================================

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

  // =========================================
  // COMMENTS
  // =========================================

  sendCommentCreated(projectId: string, taskId: string, comment: any) {
    try {
      const io = getIO();

      console.log("💬 Sending comment created:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("comment:created", {
        taskId,
        comment,
      });
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping comment created.", error);
    }
  }

  sendCommentUpdated(projectId: string, taskId: string, comment: any) {
    try {
      const io = getIO();

      console.log("💬 Sending comment updated:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("comment:updated", {
        taskId,
        comment,
      });
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping comment updated.", error);
    }
  }

  sendCommentDeleted(projectId: string, taskId: string, commentId: string) {
    try {
      const io = getIO();

      console.log("💬 Sending comment deleted:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("comment:deleted", {
        taskId,
        commentId,
      });
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping comment deletion.", error);
    }
  }

  // =========================================
  // NOTIFICATIONS
  // =========================================

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
