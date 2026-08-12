import { getIO } from "./index";

export class SocketService {
  // =========================================
  // PROJECTS
  // =========================================

  sendProjectCreated(workspaceId: string, project: any): void {
    try {
      const io = getIO();

      console.log("📁 Sending project created:", `workspace:${workspaceId}`);

      io.to(`workspace:${workspaceId}`).emit("project:created", project);
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping project creation.", error);
    }
  }

  sendProjectUpdated(workspaceId: string, project: any): void {
    try {
      const io = getIO();

      console.log("📁 Sending project updated:", `workspace:${workspaceId}`);

      io.to(`workspace:${workspaceId}`).emit("project:updated", project);
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping project update.", error);
    }
  }
  // =========================================
  // WORKSPACE UPDATED
  // =========================================

  sendWorkspaceUpdated(workspaceId: string, workspace: any): void {
    try {
      const io = getIO();

      console.log("🏢 Sending workspace updated:", `workspace:${workspaceId}`);

      io.to(`workspace:${workspaceId}`).emit("workspace:updated", workspace);
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping workspace update.", error);
    }
  }
  // =========================================
  // TASK CREATED
  // =========================================

  sendTaskCreated(projectId: string, task: any) {
    try {
      const io = getIO();

      console.log("🆕 Sending task created:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("task:created", task);
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping task creation.", error);
    }
  }

  // =========================================
  // TASK UPDATED
  // =========================================

  sendTaskUpdate(projectId: string, task: any) {
    try {
      const io = getIO();

      console.log("🔄 Sending task updated:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("task:updated", task);
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping task update.", error);
    }
  }
  // =========================================
  // TASK STATUS CHANGED
  // =========================================

  sendTaskStatusChanged(projectId: string, task: any) {
    try {
      const io = getIO();

      console.log("🔄 Sending task status changed:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("task:status-changed", task);
    } catch (error) {
      console.warn(
        "Socket.IO unavailable. Skipping task status change.",
        error,
      );
    }
  }
  // =========================================
  // TASK ASSIGNED
  // =========================================

  sendTaskAssigned(projectId: string, task: any) {
    try {
      const io = getIO();

      console.log("👤 Sending task assigned:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("task:assigned", task);
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping task assignment.", error);
    }
  }

  // =========================================
  // TASK DELETED
  // =========================================

  sendTaskDeleted(projectId: string, taskId: string) {
    try {
      const io = getIO();

      console.log("🗑️ Sending task deleted:", `project:${projectId}`);

      io.to(`project:${projectId}`).emit("task:deleted", {
        taskId,
      });
    } catch (error) {
      console.warn("Socket.IO unavailable. Skipping task deletion.", error);
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
