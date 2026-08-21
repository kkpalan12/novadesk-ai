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

  private realtimeInitialized = false;

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
  // DELETE
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
  // REAL-TIME
  // =========================================

  initializeRealtime(): void {
    if (this.realtimeInitialized) {
      return;
    }

    this.realtimeInitialized = true;

    this.socketService.connect();

    // -----------------------------------------
    // NEW NOTIFICATION
    // -----------------------------------------

    this.socketService.onNotification((notification: Notification) => {
      if (!notification?._id) {
        return;
      }

      this.notifications.update((items) => {
        // Prevent duplicate notification
        if (items.some((item) => item._id === notification._id)) {
          return items;
        }

        return [notification, ...items];
      });
    });

    // -----------------------------------------
    // REAL-TIME UNREAD COUNT
    // -----------------------------------------

    this.socketService.onUnreadCount((data: { count: number }) => {
      this.unreadCount.set(data?.count ?? 0);
    });

    // -----------------------------------------
    // INITIAL COUNT
    // -----------------------------------------

    this.refreshUnreadCount();
  }

  // =========================================
  // LOAD INTO SHARED STATE
  // =========================================

  setNotifications(notifications: Notification[]): void {
    const uniqueNotifications = notifications.filter(
      (notification, index, items) =>
        items.findIndex((item) => item._id === notification._id) === index,
    );

    this.notifications.set(uniqueNotifications);

    this.unreadCount.set(
      uniqueNotifications.filter((notification) => !notification.isRead).length,
    );
  }

  // =========================================
  // MARK LOCAL AS READ
  // =========================================

  markNotificationReadLocally(notificationId: string): void {
    this.notifications.update((items) =>
      items.map((notification) =>
        notification._id === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    );
  }

  // =========================================
  // MARK ALL LOCAL AS READ
  // =========================================

  markAllNotificationsReadLocally(): void {
    this.notifications.update((items) =>
      items.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );

    this.unreadCount.set(0);
  }

  // =========================================
  // REMOVE LOCALLY
  // =========================================

  removeNotification(notificationId: string): void {
    const existing = this.notifications().find(
      (notification) => notification._id === notificationId,
    );

    this.notifications.update((items) =>
      items.filter((item) => item._id !== notificationId),
    );

    if (existing && !existing.isRead) {
      this.unreadCount.update((count) => Math.max(0, count - 1));
    }
  }

  // =========================================
  // CLEAR
  // =========================================

  clear(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}
