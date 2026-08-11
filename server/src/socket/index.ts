import http from "http";
import { Server } from "socket.io";

import { SOCKET_EVENTS } from "./socket.events";
import { socketAuth, AuthenticatedSocket } from "./socket.middleware";
import { presenceService } from "./presence.service";

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Change in production
      credentials: true,
    },
  });

  /**
   * Authenticate Socket Connection
   */
  io.use(socketAuth);

  /**
   * Handle Connection
   */
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;

    /**
     * Join personal room
     */
    socket.join(userId);

    /**
     * Track presence
     */
    presenceService.userConnected(userId, socket.id);

    console.log(`✅ User ${userId} connected (${socket.id})`);

    /**
     * Broadcast user online
     */
    io.emit(SOCKET_EVENTS.USER_ONLINE, {
      userId,
    });

    /**
     * Broadcast online users list
     */
    io.emit(SOCKET_EVENTS.ONLINE_USERS, presenceService.getOnlineUsers());

    /**
     * Join Project Room
     *
     * Angular will emit:
     * socket.emit("join-project", projectId);
     */
    socket.on(SOCKET_EVENTS.JOIN_PROJECT, (projectId: string) => {
      socket.join(`project:${projectId}`);

      console.log(`📁 User ${userId} joined project ${projectId}`);
    });

    /**
     * Leave Project Room
     */
    socket.on(SOCKET_EVENTS.LEAVE_PROJECT, (projectId: string) => {
      socket.leave(`project:${projectId}`);

      console.log(`📁 User ${userId} left project ${projectId}`);
    });

    /**
     * Disconnect
     */
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      presenceService.userDisconnected(userId);

      console.log(`❌ User ${userId} disconnected`);

      io.emit(SOCKET_EVENTS.USER_OFFLINE, {
        userId,
      });

      io.emit(SOCKET_EVENTS.ONLINE_USERS, presenceService.getOnlineUsers());
    });
  });

  return io;
};

/**
 * Get Socket.IO Instance
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
};
