import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private readonly authService = inject(AuthService);

  private socket: Socket | null = null;

  /**
   * Projects requested before socket connection completes.
   */
  private readonly pendingProjectRooms = new Set<string>();

  // =========================================
  // CONNECT
  // =========================================

  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');

      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      console.warn('⚠️ Socket: access token missing');

      return;
    }

    const socketUrl = new URL(environment.apiUrl).origin;

    console.log('🔌 Connecting Socket.IO...');
    console.log('Socket URL:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token,
      },

      transports: ['polling', 'websocket'],

      reconnection: true,
    });

    // =========================================
    // CONNECTED
    // =========================================

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);

      // Join projects requested while socket
      // was still connecting.
      this.pendingProjectRooms.forEach((projectId) => {
        this.joinProjectRoom(projectId);
      });

      this.pendingProjectRooms.clear();
    });

    // =========================================
    // CONNECTION ERROR
    // =========================================

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    // =========================================
    // DISCONNECTED
    // =========================================

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
    });
  }

  // =========================================
  // NOTIFICATIONS
  // =========================================

  onNotification(callback: (notification: any) => void): void {
    this.socket?.on('notification:new', callback);
  }

  onUnreadCount(callback: (data: { count: number }) => void): void {
    this.socket?.on('notification:unread-count', callback);
  }

  // =========================================
  // PROJECT ROOM
  // =========================================

  joinProject(projectId: string): void {
    if (!projectId) {
      return;
    }

    // Socket not connected yet.
    // Store the room and join automatically
    // when connection completes.
    if (!this.socket?.connected) {
      console.log(
        '⏳ Socket not connected yet. Queuing project room:',
        projectId,
      );

      this.pendingProjectRooms.add(projectId);

      return;
    }

    this.joinProjectRoom(projectId);
  }

  private joinProjectRoom(projectId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('📁 Joining project room:', projectId);

    this.socket.emit('join-project', projectId);
  }

  leaveProject(projectId: string): void {
    if (!projectId) {
      return;
    }

    this.pendingProjectRooms.delete(projectId);

    if (!this.socket?.connected) {
      return;
    }

    console.log('📁 Leaving project room:', projectId);

    this.socket.emit('leave-project', projectId);
  }

  // =========================================
  // TASK EVENTS
  // =========================================

  onTaskUpdated(callback: (task: any) => void): void {
    this.socket?.on('task:updated', callback);
  }

  onTaskDeleted(callback: (data: { taskId: string }) => void): void {
    this.socket?.on('task:deleted', callback);
  }

  // =========================================
  // DISCONNECT
  // =========================================

  disconnect(): void {
    this.pendingProjectRooms.clear();

    this.socket?.disconnect();

    this.socket = null;
  }

  // =========================================
  // STATUS
  // =========================================

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
  // =========================================
  // COMMENT EVENTS
  // =========================================

  onCommentCreated(
    callback: (data: { taskId: string; comment: any }) => void,
  ): void {
    this.socket?.on('comment:created', callback);
  }

  onCommentUpdated(
    callback: (data: { taskId: string; comment: any }) => void,
  ): void {
    this.socket?.on('comment:updated', callback);
  }

  onCommentDeleted(
    callback: (data: { taskId: string; commentId: string }) => void,
  ): void {
    this.socket?.on('comment:deleted', callback);
  }
}
