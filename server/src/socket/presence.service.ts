export class PresenceService {
  private readonly onlineUsers = new Map<string, string>();

  userConnected(userId: string, socketId: string) {
    this.onlineUsers.set(userId, socketId);
  }

  userDisconnected(userId: string) {
    this.onlineUsers.delete(userId);
  }

  isOnline(userId: string) {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  getOnlineCount() {
    return this.onlineUsers.size;
  }
}

export const presenceService = new PresenceService();
