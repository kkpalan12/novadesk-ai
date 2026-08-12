import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { SocketService } from './socket.service';

import {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly api = inject(ApiService);

  private readonly socketService = inject(SocketService);

  // =========================================
  // STATE
  // =========================================

  readonly unreadCount = signal(0);

  readonly notifications = signal<Notification[]>([]);

  // =========================================
  // GET MY NOTIFICATIONS
  // =========================================

  getNotifications(): Observable<NotificationsResponse> {
    return this.api.get<NotificationsResponse>('/notifications');
  }

  // =========================================
  // MARK ONE AS READ
  // =========================================

  markAsRead(notificationId: string): Observable<unknown> {
    return this.api.patch(`/notifications/${notificationId}/read`, {});
  }

  // =========================================
  // MARK ALL AS READ
  // =========================================

  markAllAsRead(): Observable<unknown> {
    return this.api.patch('/notifications/read-all', {});
  }

  // =========================================
  // DELETE NOTIFICATION
  // =========================================

  deleteNotification(notificationId: string): Observable<unknown> {
    return this.api.delete(`/notifications/${notificationId}`);
  }

  // =========================================
  // GET UNREAD COUNT
  // =========================================

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.api.get<UnreadCountResponse>('/notifications/unread-count');
  }

  // =========================================
  // REFRESH UNREAD COUNT
  // =========================================

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount.set(response.data?.count ?? 0);
      },

      error: (error) => {
        console.error('Load unread notification count error:', error);
      },
    });
  }

  // =========================================
  // START REAL-TIME NOTIFICATIONS
  // =========================================

  initializeRealtime(): void {
    this.socketService.connect();

    // =======================================
    // NEW NOTIFICATION
    // =======================================

    this.socketService.onNotification((notification: Notification) => {
      console.log('🔔 REAL-TIME NOTIFICATION:', notification);

      this.notifications.update((items) => [notification, ...items]);

      /*
       * Do NOT increment unreadCount here.
       *
       * Backend sends the authoritative unread
       * count through notification:unread-count.
       */
    });

    // =======================================
    // REAL-TIME UNREAD COUNT
    // =======================================

    this.socketService.onUnreadCount((data: { count: number }) => {
      console.log('🔔 REAL-TIME UNREAD COUNT:', data.count);

      this.unreadCount.set(data?.count ?? 0);
    });

    // =======================================
    // INITIAL COUNT
    // =======================================

    this.refreshUnreadCount();
  }

  // =========================================
  // SET NOTIFICATIONS
  // =========================================

  setNotifications(notifications: Notification[]): void {
    this.notifications.set(notifications);

    this.unreadCount.set(
      notifications.filter((notification) => !notification.isRead).length,
    );
  }

  // =========================================
  // REMOVE NOTIFICATION LOCALLY
  // =========================================

  removeNotification(notificationId: string): void {
    this.notifications.update((items) =>
      items.filter((item) => item._id !== notificationId),
    );
  }

  // =========================================
  // CLEAR
  // =========================================

  clear(): void {
    this.notifications.set([]);

    this.unreadCount.set(0);
  }
}
