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

    // =========================================
    // Socket Server URL
    // =========================================

    const apiUrl = environment.apiUrl;

    const socketUrl = new URL(apiUrl).origin;

    console.log('🔌 Connecting Socket.IO...');
    console.log('Socket URL:', socketUrl);

    // =========================================
    // Connect
    // =========================================

    this.socket = io(socketUrl, {
      auth: {
        token,
      },

      transports: ['polling', 'websocket'],

      reconnection: true,
    });

    // =========================================
    // Connected
    // =========================================

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    // =========================================
    // Connection Error
    // =========================================

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    // =========================================
    // Disconnected
    // =========================================

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
    });
  }

  // =========================================
  // Notifications
  // =========================================

  onNotification(callback: (notification: any) => void): void {
    this.socket?.on('notification:new', callback);
  }

  onUnreadCount(callback: (data: { count: number }) => void): void {
    this.socket?.on('notification:unread-count', callback);
  }

  // =========================================
  // Project Room
  // =========================================

  joinProject(projectId: string): void {
    this.socket?.emit('join-project', projectId);
  }

  leaveProject(projectId: string): void {
    this.socket?.emit('leave-project', projectId);
  }

  // =========================================
  // Task Events
  // =========================================

  onTaskUpdated(callback: (task: any) => void): void {
    this.socket?.on('task:updated', callback);
  }

  onTaskDeleted(callback: (data: { taskId: string }) => void): void {
    this.socket?.on('task:deleted', callback);
  }

  // =========================================
  // Disconnect
  // =========================================

  disconnect(): void {
    this.socket?.disconnect();

    this.socket = null;
  }

  // =========================================
  // Status
  // =========================================

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
