export class PresenceService {
  private readonly onlineUsers = new Map<string, Set<string>>();

  // =========================================
  // USER CONNECTED
  // =========================================

  userConnected(userId: string, socketId: string): boolean {
    const existingSockets = this.onlineUsers.get(userId);

    // User already has another active socket
    if (existingSockets) {
      existingSockets.add(socketId);

      return false;
    }

    // First socket for this user
    this.onlineUsers.set(userId, new Set([socketId]));

    return true;
  }

  // =========================================
  // USER DISCONNECTED
  // =========================================

  userDisconnected(userId: string, socketId: string): boolean {
    const sockets = this.onlineUsers.get(userId);

    if (!sockets) {
      return false;
    }

    sockets.delete(socketId);

    // User still has another active socket
    if (sockets.size > 0) {
      return false;
    }

    // No sockets remain
    this.onlineUsers.delete(userId);

    return true;
  }

  // =========================================
  // IS ONLINE
  // =========================================

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  // =========================================
  // GET ONLINE USERS
  // =========================================

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  // =========================================
  // GET ONLINE COUNT
  // =========================================

  getOnlineCount(): number {
    return this.onlineUsers.size;
  }
}

export const presenceService = new PresenceService();
