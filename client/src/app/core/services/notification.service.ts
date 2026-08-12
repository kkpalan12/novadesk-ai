import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

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
  readonly unreadCount = signal(0);

  // =========================================
  // Get My Notifications
  // =========================================

  getNotifications(): Observable<NotificationsResponse> {
    return this.api.get<NotificationsResponse>('/notifications');
  }

  // =========================================
  // Mark Notification As Read
  // =========================================

  markAsRead(notificationId: string): Observable<unknown> {
    return this.api.patch(`/notifications/${notificationId}/read`, {});
  }

  // =========================================
  // Mark All As Read
  // =========================================

  markAllAsRead(): Observable<unknown> {
    return this.api.patch('/notifications/read-all', {});
  }

  // =========================================
  // Delete Notification
  // =========================================

  deleteNotification(notificationId: string): Observable<unknown> {
    return this.api.delete(`/notifications/${notificationId}`);
  }

  // =========================================
  // Get Unread Count
  // =========================================
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.api.get<UnreadCountResponse>('/notifications/unread-count');
  }
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
}
