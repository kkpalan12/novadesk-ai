import { getIO } from "./index";
import { logger } from "../common/logger";

export class SocketService {
  // =========================================
  // PROJECTS
  // =========================================

  sendProjectCreated(workspaceId: string, project: any): void {
    try {
      const io = getIO();

      logger.debug({ workspaceId }, "Sending project created");

      io.to(`workspace:${workspaceId}`).emit("project:created", project);
    } catch (error) {
      logger.warn(
        { err: error, workspaceId },
        "Socket.IO unavailable. Skipping project creation.",
      );
    }
  }

  sendProjectUpdated(workspaceId: string, project: any): void {
    try {
      const io = getIO();

      logger.debug({ workspaceId }, "Sending project updated");

      io.to(`workspace:${workspaceId}`).emit("project:updated", project);
    } catch (error) {
      logger.warn(
        { err: error, workspaceId },
        "Socket.IO unavailable. Skipping project update.",
      );
    }
  }

  // =========================================
  // WORKSPACE UPDATED
  // =========================================

  sendWorkspaceUpdated(workspaceId: string, workspace: any): void {
    try {
      const io = getIO();

      logger.debug({ workspaceId }, "Sending workspace updated");

      io.to(`workspace:${workspaceId}`).emit("workspace:updated", workspace);
    } catch (error) {
      logger.warn(
        { err: error, workspaceId },
        "Socket.IO unavailable. Skipping workspace update.",
      );
    }
  }

  // =========================================
  // TASK CREATED
  // =========================================

  sendTaskCreated(projectId: string, task: any): void {
    try {
      const io = getIO();

      logger.debug({ projectId }, "Sending task created");

      io.to(`project:${projectId}`).emit("task:created", task);
    } catch (error) {
      logger.warn(
        { err: error, projectId },
        "Socket.IO unavailable. Skipping task creation.",
      );
    }
  }

  // =========================================
  // TASK UPDATED
  // =========================================

  sendTaskUpdate(projectId: string, task: any): void {
    try {
      const io = getIO();

      logger.debug({ projectId }, "Sending task updated");

      io.to(`project:${projectId}`).emit("task:updated", task);
    } catch (error) {
      logger.warn(
        { err: error, projectId },
        "Socket.IO unavailable. Skipping task update.",
      );
    }
  }

  // =========================================
  // TASK STATUS CHANGED
  // =========================================

  sendTaskStatusChanged(projectId: string, task: any): void {
    try {
      const io = getIO();

      logger.debug({ projectId }, "Sending task status changed");

      io.to(`project:${projectId}`).emit("task:status-changed", task);
    } catch (error) {
      logger.warn(
        { err: error, projectId },
        "Socket.IO unavailable. Skipping task status change.",
      );
    }
  }

  // =========================================
  // TASK ASSIGNED
  // =========================================

  sendTaskAssigned(projectId: string, task: any): void {
    try {
      const io = getIO();

      logger.debug({ projectId }, "Sending task assigned");

      io.to(`project:${projectId}`).emit("task:assigned", task);
    } catch (error) {
      logger.warn(
        { err: error, projectId },
        "Socket.IO unavailable. Skipping task assignment.",
      );
    }
  }

  // =========================================
  // TASK DELETED
  // =========================================

  sendTaskDeleted(projectId: string, taskId: string): void {
    try {
      const io = getIO();

      logger.debug({ projectId, taskId }, "Sending task deleted");

      io.to(`project:${projectId}`).emit("task:deleted", {
        taskId,
      });
    } catch (error) {
      logger.warn(
        { err: error, projectId, taskId },
        "Socket.IO unavailable. Skipping task deletion.",
      );
    }
  }

  // =========================================
  // COMMENTS
  // =========================================

  sendCommentCreated(projectId: string, taskId: string, comment: any): void {
    try {
      const io = getIO();

      logger.debug({ projectId, taskId }, "Sending comment created");

      io.to(`project:${projectId}`).emit("comment:created", {
        taskId,
        comment,
      });
    } catch (error) {
      logger.warn(
        { err: error, projectId, taskId },
        "Socket.IO unavailable. Skipping comment created.",
      );
    }
  }

  sendCommentUpdated(projectId: string, taskId: string, comment: any): void {
    try {
      const io = getIO();

      logger.debug({ projectId, taskId }, "Sending comment updated");

      io.to(`project:${projectId}`).emit("comment:updated", {
        taskId,
        comment,
      });
    } catch (error) {
      logger.warn(
        { err: error, projectId, taskId },
        "Socket.IO unavailable. Skipping comment updated.",
      );
    }
  }

  sendCommentDeleted(
    projectId: string,
    taskId: string,
    commentId: string,
  ): void {
    try {
      const io = getIO();

      logger.debug({ projectId, taskId, commentId }, "Sending comment deleted");

      io.to(`project:${projectId}`).emit("comment:deleted", {
        taskId,
        commentId,
      });
    } catch (error) {
      logger.warn(
        { err: error, projectId, taskId, commentId },
        "Socket.IO unavailable. Skipping comment deletion.",
      );
    }
  }

  // =========================================
  // NOTIFICATIONS
  // =========================================

  sendNotification(userId: string, notification: any): void {
    try {
      const io = getIO();

      logger.debug({ userId }, "Sending notification");

      io.to(`user:${userId}`).emit("notification:new", notification);
    } catch (error) {
      logger.warn(
        { err: error, userId },
        "Socket.IO unavailable. Skipping notification.",
      );
    }
  }

  sendUnreadCount(userId: string, count: number): void {
    try {
      const io = getIO();

      logger.debug({ userId, count }, "Sending unread notification count");

      io.to(`user:${userId}`).emit("notification:unread-count", {
        count,
      });
    } catch (error) {
      logger.warn(
        { err: error, userId },
        "Socket.IO unavailable. Skipping unread count.",
      );
    }
  }

  // =========================================
  // ACTIVITY
  // =========================================

  sendActivityCreated(projectId: string, activity: any): void {
    try {
      const io = getIO();

      logger.debug({ projectId }, "Sending activity created");

      io.to(`project:${projectId}`).emit("activity:created", activity);
    } catch (error) {
      logger.warn(
        { err: error, projectId },
        "Socket.IO unavailable. Skipping activity creation.",
      );
    }
  }

  // =========================================
  // WORKSPACE ACTIVITY
  // =========================================

  sendWorkspaceActivityCreated(workspaceId: string, activity: any): void {
    try {
      const io = getIO();

      logger.debug({ workspaceId }, "Sending workspace activity");

      io.to(`workspace:${workspaceId}`).emit("activity:created", activity);
    } catch (error) {
      logger.warn(
        { err: error, workspaceId },
        "Socket.IO unavailable. Skipping workspace activity.",
      );
    }
  }
}
