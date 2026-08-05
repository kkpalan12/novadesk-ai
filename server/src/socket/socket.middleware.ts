import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface SocketUser {
  userId: string;
  role: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export const socketAuth = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as SocketUser;

    socket.user = decoded;

    next();
  } catch {
    next(new Error("Invalid token"));
  }
};
