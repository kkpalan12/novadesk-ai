import http from "http";
import { Server } from "socket.io";

import { SOCKET_EVENTS } from "./socket.events";
import { socketAuth, AuthenticatedSocket } from "./socket.middleware";

import { presenceService } from "./presence.service";
import { logger } from "../common/logger";

let io: Server;

/**
 * Initialize Socket.IO
 */
export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
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

    logger.info({ socketId: socket.id, userId }, "Socket connection received");

    // =========================================
    // PERSONAL USER ROOM
    // =========================================

    const userRoom = `user:${userId}`;

    socket.join(userRoom);

    logger.debug(
      { userId, socketId: socket.id, room: userRoom },
      "User joined personal room",
    );

    // =========================================
    // PRESENCE - CONNECTED
    // =========================================

    const becameOnline = presenceService.userConnected(userId, socket.id);

    logger.debug(
      {
        userId,
        socketId: socket.id,
        becameOnline,
      },
      "User connected",
    );

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

      logger.debug({ userId }, "User is online");
    }

    // =========================================
    // REQUEST CURRENT ONLINE USERS
    // =========================================

    socket.on("get-online-users", () => {
      logger.debug({ userId, socketId: socket.id }, "Sending online users");

      socket.emit(SOCKET_EVENTS.ONLINE_USERS, presenceService.getOnlineUsers());
    });

    // =========================================
    // JOIN PROJECT ROOM
    // =========================================

    socket.on(SOCKET_EVENTS.JOIN_PROJECT, (projectId: string) => {
      if (!projectId) {
        logger.warn(
          { userId, socketId: socket.id },
          "User attempted to join empty project room",
        );

        return;
      }

      const roomName = `project:${projectId}`;

      socket.join(roomName);

      logger.debug(
        {
          userId,
          socketId: socket.id,
          room: roomName,
        },
        "User joined project room",
      );
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

      logger.debug(
        {
          userId,
          socketId: socket.id,
          room: roomName,
        },
        "User left project room",
      );
    });

    // =========================================
    // JOIN WORKSPACE ROOM
    // =========================================

    socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, (workspaceId: string) => {
      if (!workspaceId) {
        logger.warn(
          { userId, socketId: socket.id },
          "User attempted to join empty workspace room",
        );

        return;
      }

      const roomName = `workspace:${workspaceId}`;

      socket.join(roomName);

      logger.debug(
        {
          userId,
          socketId: socket.id,
          room: roomName,
        },
        "User joined workspace room",
      );
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

      logger.debug(
        {
          userId,
          socketId: socket.id,
          room: roomName,
        },
        "User left workspace room",
      );
    });

    // =========================================
    // DISCONNECT
    // =========================================

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      logger.info(
        {
          userId,
          socketId: socket.id,
          reason,
        },
        "Socket disconnected",
      );

      const becameOffline = presenceService.userDisconnected(userId, socket.id);

      if (becameOffline) {
        io.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId,
        });

        logger.debug({ userId }, "User is offline");
      } else {
        logger.debug(
          {
            userId,
            socketId: socket.id,
          },
          "Socket disconnected but user remains online",
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
