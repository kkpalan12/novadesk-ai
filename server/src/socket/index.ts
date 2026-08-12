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

    // =========================================
    // Personal User Room
    // =========================================

    socket.join(`user:${userId}`);

    console.log(`👤 User ${userId} joined room user:${userId}`);

    // =========================================
    // Presence
    // =========================================

    presenceService.userConnected(userId, socket.id);

    console.log(`✅ User ${userId} connected (${socket.id})`);

    // ...rest of your existing code
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
