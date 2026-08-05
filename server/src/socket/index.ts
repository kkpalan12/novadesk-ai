import http from "http";
import { Server } from "socket.io";

import { SOCKET_EVENTS } from "./socket.events";
import { socketAuth, AuthenticatedSocket } from "./socket.middleware";

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Change to your Angular URL in production
      credentials: true,
    },
  });

  /**
   * Socket Authentication
   */
  io.use(socketAuth);

  /**
   * Socket Connection
   */
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;

    /**
     * Automatically join user's room
     */
    socket.join(userId);
    console.log("Joined Room:", userId);

    console.log(`✅ User ${userId} connected (${socket.id})`);

    /**
     * Disconnect
     */
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`❌ User ${userId} disconnected`);
    });
  });

  return io;
};

/**
 * Get Socket.IO Instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
};
