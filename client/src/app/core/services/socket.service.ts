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
  private readonly pendingWorkspaceRooms = new Set<string>();

  // =========================================
  // CONNECT
  // =========================================

  connect(): void {
    // =========================================
    // SOCKET ALREADY EXISTS
    // =========================================

    if (this.socket) {
      if (this.socket.connected) {
        console.log('🔌 Socket already connected');

        return;
      }

      console.log('🔄 Socket exists but is disconnected. Reconnecting...');

      this.socket.connect();

      return;
    }

    // =========================================
    // ACCESS TOKEN
    // =========================================

    const token = this.authService.getToken();

    if (!token) {
      console.warn('⚠️ Socket: access token missing');

      return;
    }

    const socketUrl = new URL(environment.apiUrl).origin;

    console.log('🔌 Creating Socket.IO connection...');

    console.log('Socket URL:', socketUrl);

    // =========================================
    // CREATE SOCKET ONLY ONCE
    // =========================================

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

      // =========================================
      // JOIN PENDING PROJECT ROOMS
      // =========================================

      this.pendingProjectRooms.forEach((projectId) => {
        this.joinProjectRoom(projectId);
      });

      this.pendingProjectRooms.clear();

      // =========================================
      // JOIN PENDING WORKSPACE ROOMS
      // =========================================

      this.pendingWorkspaceRooms.forEach((workspaceId) => {
        this.joinWorkspaceRoom(workspaceId);
      });

      this.pendingWorkspaceRooms.clear();
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
    this.socket?.off('notification:new');
    this.socket?.on('notification:new', callback);
  }

  onUnreadCount(callback: (data: { count: number }) => void): void {
    this.socket?.off('notification:unread-count');
    this.socket?.on('notification:unread-count', callback);
  }
  // =========================================
  // REMOVE NOTIFICATION LISTENERS
  // =========================================

  removeNotificationListeners(): void {
    this.socket?.off('notification:new');
    this.socket?.off('notification:unread-count');

    console.log('🧹 Notification socket listeners removed');
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

  onTaskStatusChanged(callback: (task: any) => void): void {
    this.socket?.off('task:status-changed');

    this.socket?.on('task:status-changed', callback);
  }

  // =========================================
  // REMOVE TASK LISTENERS
  // =========================================

  removeTaskListeners(): void {
    this.socket?.off('task:created');
    this.socket?.off('task:updated');
    this.socket?.off('task:assigned');
    this.socket?.off('task:status-changed');
    this.socket?.off('task:deleted');

    console.log('🧹 Task socket listeners removed');
  }
  // =========================================
  // DISCONNECT
  // =========================================
  disconnect(): void {
    this.pendingProjectRooms.clear();

    this.pendingWorkspaceRooms.clear();

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
  // =========================================
  // COMMENT EVENTS
  // =========================================

  onCommentCreated(
    callback: (data: { taskId: string; comment: any }) => void,
  ): void {
    this.socket?.off('comment:created');

    this.socket?.on('comment:created', callback);
  }

  onCommentUpdated(
    callback: (data: { taskId: string; comment: any }) => void,
  ): void {
    this.socket?.off('comment:updated');

    this.socket?.on('comment:updated', callback);
  }

  onCommentDeleted(
    callback: (data: { taskId: string; commentId: string }) => void,
  ): void {
    this.socket?.off('comment:deleted');

    this.socket?.on('comment:deleted', callback);
  }
  // =========================================
  // REMOVE COMMENT LISTENERS
  // =========================================

  removeCommentListeners(): void {
    this.socket?.off('comment:created');
    this.socket?.off('comment:updated');
    this.socket?.off('comment:deleted');

    console.log('🧹 Comment socket listeners removed');
  }
  onTaskCreated(callback: (task: any) => void): void {
    this.socket?.off('task:created');
    this.socket?.on('task:created', callback);
  }

  onTaskUpdated(callback: (task: any) => void): void {
    this.socket?.off('task:updated');
    this.socket?.on('task:updated', callback);
  }

  onTaskAssigned(callback: (task: any) => void): void {
    this.socket?.off('task:assigned');
    this.socket?.on('task:assigned', callback);
  }

  onTaskDeleted(callback: (data: { taskId: string }) => void): void {
    this.socket?.off('task:deleted');
    this.socket?.on('task:deleted', callback);
  }
  // =========================================
  // PROJECT EVENTS
  // =========================================

  onProjectCreated(callback: (project: any) => void): void {
    this.socket?.off('project:created');

    this.socket?.on('project:created', callback);
  }

  onProjectUpdated(callback: (project: any) => void): void {
    this.socket?.off('project:updated');

    this.socket?.on('project:updated', callback);
  }

  // =========================================
  // WORKSPACE ROOM
  // =========================================

  joinWorkspace(workspaceId: string): void {
    if (!workspaceId) {
      return;
    }

    // Socket not connected yet.
    // Queue workspace room and join automatically
    // after connection completes.
    if (!this.socket?.connected) {
      console.log(
        '⏳ Socket not connected yet. Queuing workspace room:',
        workspaceId,
      );

      this.pendingWorkspaceRooms.add(workspaceId);

      return;
    }

    this.joinWorkspaceRoom(workspaceId);
  }
  private joinWorkspaceRoom(workspaceId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('🏢 Joining workspace room:', workspaceId);

    this.socket.emit('join-workspace', workspaceId);
  }
  leaveWorkspace(workspaceId: string): void {
    if (!workspaceId) {
      return;
    }

    this.pendingWorkspaceRooms.delete(workspaceId);

    if (!this.socket?.connected) {
      return;
    }

    console.log('🏢 Leaving workspace room:', workspaceId);

    this.socket.emit('leave-workspace', workspaceId);
  }
  removeProjectListeners(): void {
    this.socket?.off('project:created');
    this.socket?.off('project:updated');

    console.log('🧹 Project socket listeners removed');
  }
  // =========================================
  // WORKSPACE EVENTS
  // =========================================

  onWorkspaceUpdated(callback: (workspace: any) => void): void {
    this.socket?.off('workspace:updated');

    this.socket?.on('workspace:updated', callback);
  }

  removeWorkspaceListeners(): void {
    this.socket?.off('workspace:updated');

    console.log('🧹 Workspace socket listeners removed');
  }
  // =========================================
  // PRESENCE
  // =========================================
  onUserOnline(callback: (data: { userId: string }) => void): void {
    this.socket?.off('user-online');

    this.socket?.on('user-online', (data) => {
      console.log('🟢 SOCKET SERVICE USER ONLINE:', data);

      callback(data);
    });
  }

  onUserOffline(callback: (data: { userId: string }) => void): void {
    this.socket?.off('user-offline');

    this.socket?.on('user-offline', (data) => {
      console.log('🔴 SOCKET SERVICE USER OFFLINE:', data);

      callback(data);
    });
  }

  onOnlineUsers(callback: (userIds: string[]) => void): void {
    this.socket?.off('online-users');

    this.socket?.on('online-users', callback);
  }

  removePresenceListeners(): void {
    this.socket?.off('user-online');
    this.socket?.off('user-offline');
    this.socket?.off('online-users');

    console.log('🧹 Presence socket listeners removed');
  }
  requestOnlineUsers(): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Cannot request online users before socket connection');

      return;
    }

    console.log('🟢 Requesting current online users');

    this.socket.emit('get-online-users');
  }
  // =========================================
  // ACTIVITY EVENTS
  // =========================================

  onActivityCreated(callback: (activity: any) => void): void {
    this.socket?.off('activity:created');

    this.socket?.on('activity:created', callback);
  }

  removeActivityListeners(): void {
    this.socket?.off('activity:created');

    console.log('🧹 Activity socket listeners removed');
  }
}
