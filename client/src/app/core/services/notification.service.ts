import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  NotificationActionResponse,
  NotificationResponse,
  NotificationsResponse,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly api = inject(ApiService);

  getNotifications(page = 1, limit = 20): Observable<NotificationsResponse> {
    return this.api.get<NotificationsResponse>(
      `/notifications?page=${page}&limit=${limit}`,
    );
  }

  getNotification(notificationId: string): Observable<NotificationResponse> {
    return this.api.get<NotificationResponse>(
      `/notifications/${notificationId}`,
    );
  }

  markAsRead(notificationId: string): Observable<NotificationActionResponse> {
    return this.api.patch<NotificationActionResponse>(
      `/notifications/${notificationId}/read`,
      {},
    );
  }

  markAllAsRead(): Observable<NotificationActionResponse> {
    return this.api.patch<NotificationActionResponse>(
      '/notifications/read-all',
      {},
    );
  }

  deleteNotification(
    notificationId: string,
  ): Observable<NotificationActionResponse> {
    return this.api.delete<NotificationActionResponse>(
      `/notifications/${notificationId}`,
    );
  }
}
