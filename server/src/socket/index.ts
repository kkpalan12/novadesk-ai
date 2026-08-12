import http from "http";
import { Server } from "socket.io";

import { SOCKET_EVENTS } from "./socket.events";
import { socketAuth, AuthenticatedSocket } from "./socket.middleware";

import { presenceService } from "./presence.service";

let io: Server;

/**
 * Initialize Socket.IO
 */
export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Change in production
      credentials: true,
    },
  });

  // =========================================
  // SOCKET AUTHENTICATION
  // =========================================

  io.use(socketAuth);

  // =========================================
  // CONNECTION
  // =========================================

  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;

    console.log(`🔌 Socket connection received: ${socket.id}`);

    // =========================================
    // PERSONAL USER ROOM
    // =========================================

    const userRoom = `user:${userId}`;

    socket.join(userRoom);

    console.log(`👤 User ${userId} joined room ${userRoom}`);

    // =========================================
    // PRESENCE - CONNECTED
    // =========================================

    const becameOnline = presenceService.userConnected(userId, socket.id);

    console.log(`✅ User ${userId} connected (${socket.id})`);

    // =========================================
    // CURRENT ONLINE USERS
    // =========================================

    socket.emit(SOCKET_EVENTS.ONLINE_USERS, presenceService.getOnlineUsers());

    // =========================================
    // USER ONLINE
    // =========================================

    if (becameOnline) {
      io.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId,
      });

      console.log(`🟢 User ${userId} is online`);
    }
    // =========================================
    // REQUEST CURRENT ONLINE USERS
    // =========================================
    //
    // Used when Angular component is recreated
    // after the socket is already connected.
    //
    // =========================================

    socket.on("get-online-users", () => {
      console.log(`🟢 Sending online users to ${userId}`);

      socket.emit(SOCKET_EVENTS.ONLINE_USERS, presenceService.getOnlineUsers());
    });

    // =========================================
    // JOIN PROJECT ROOM
    // =========================================

    socket.on(SOCKET_EVENTS.JOIN_PROJECT, (projectId: string) => {
      if (!projectId) {
        console.warn(`⚠️ User ${userId} attempted to join empty project room`);

        return;
      }

      const roomName = `project:${projectId}`;

      socket.join(roomName);

      console.log(`📁 User ${userId} joined project room ${roomName}`);
    });

    // =========================================
    // LEAVE PROJECT ROOM
    // =========================================

    socket.on(SOCKET_EVENTS.LEAVE_PROJECT, (projectId: string) => {
      if (!projectId) {
        return;
      }

      const roomName = `project:${projectId}`;

      socket.leave(roomName);

      console.log(`📁 User ${userId} left project room ${roomName}`);
    });

    // =========================================
    // JOIN WORKSPACE ROOM
    // =========================================

    socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, (workspaceId: string) => {
      if (!workspaceId) {
        console.warn(
          `⚠️ User ${userId} attempted to join empty workspace room`,
        );

        return;
      }

      const roomName = `workspace:${workspaceId}`;

      socket.join(roomName);

      console.log(`🏢 User ${userId} joined workspace room ${roomName}`);
    });

    // =========================================
    // LEAVE WORKSPACE ROOM
    // =========================================

    socket.on(SOCKET_EVENTS.LEAVE_WORKSPACE, (workspaceId: string) => {
      if (!workspaceId) {
        return;
      }

      const roomName = `workspace:${workspaceId}`;

      socket.leave(roomName);

      console.log(`🏢 User ${userId} left workspace room ${roomName}`);
    });

    // =========================================
    // DISCONNECT
    // =========================================

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.warn(`⚠️ User ${userId} disconnected:`, reason);

      const becameOffline = presenceService.userDisconnected(userId, socket.id);

      if (becameOffline) {
        io.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId,
        });

        console.log(`🔴 User ${userId} is offline`);
      } else {
        console.log(
          `🟡 User ${userId} disconnected socket ${socket.id}, but user is still online`,
        );
      }
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
