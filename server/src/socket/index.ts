import http from "http";
import { Server } from "socket.io";

import { SOCKET_EVENTS } from "./socket.events";

import { socketAuth, AuthenticatedSocket } from "./socket.middleware";

import { presenceService } from "./presence.service";

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  // =========================================
  // SOCKET AUTH
  // =========================================

  io.use(socketAuth);

  // =========================================
  // CONNECTION
  // =========================================

  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;

    // =========================================
    // PERSONAL USER ROOM
    // =========================================

    socket.join(`user:${userId}`);

    console.log(`👤 User ${userId} joined room user:${userId}`);

    // =========================================
    // PRESENCE
    // =========================================

    presenceService.userConnected(userId, socket.id);

    console.log(`✅ User ${userId} connected (${socket.id})`);

    // =========================================
    // USER ONLINE
    // =========================================

    io.emit(SOCKET_EVENTS.USER_ONLINE, {
      userId,
    });

    // =========================================
    // ONLINE USERS
    // =========================================

    io.emit(SOCKET_EVENTS.ONLINE_USERS, presenceService.getOnlineUsers());

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
    // DISCONNECT
    // =========================================

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

// =========================================
// GET SOCKET INSTANCE
// =========================================

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
};
