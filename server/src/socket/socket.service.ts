import { getIO } from "./index";
import { SOCKET_EVENTS } from "./socket.events";

export class SocketService {
  sendNotification(userId: string, notification: unknown) {
    console.log("📡 Emitting to room:", userId);

    getIO().to(userId).emit(SOCKET_EVENTS.NOTIFICATION, notification);
  }

  sendTaskUpdate(userId: string, task: unknown) {
    getIO().to(userId).emit(SOCKET_EVENTS.TASK_UPDATED, task);
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
}
