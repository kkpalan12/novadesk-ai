import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';

import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);

  private readonly router = inject(Router);

  readonly notifications = signal<Notification[]>([]);

  readonly loading = signal(true);

  readonly actionLoading = signal<string | null>(null);

  readonly errorMessage = signal('');

  readonly total = signal(0);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        this.notifications.set(response.data?.notifications ?? []);

        this.total.set(response.data?.total ?? 0);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Load notifications error:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load notifications.',
        );
      },
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    this.actionLoading.set(notification._id);

    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );

        this.actionLoading.set(null);
      },

      error: (error) => {
        console.error('Mark notification read error:', error);

        this.actionLoading.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to mark notification as read.',
        );
      },
    });
  }

  markAllAsRead(): void {
    const unreadExists = this.notifications().some((item) => !item.isRead);

    if (!unreadExists) {
      return;
    }

    this.actionLoading.set('all');

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.map((item) => ({
            ...item,
            isRead: true,
          })),
        );

        this.actionLoading.set(null);
      },

      error: (error) => {
        console.error('Mark all notifications read error:', error);

        this.actionLoading.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to mark all notifications as read.',
        );
      },
    });
  }

  deleteNotification(notification: Notification): void {
    this.actionLoading.set(notification._id);

    this.notificationService.deleteNotification(notification._id).subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.filter((item) => item._id !== notification._id),
        );

        this.actionLoading.set(null);

        this.total.update((value) => Math.max(0, value - 1));
      },

      error: (error) => {
        console.error('Delete notification error:', error);

        this.actionLoading.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to delete notification.',
        );
      },
    });
  }

  openNotification(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    if (notification.task) {
      const projectId = notification.project;

      if (projectId) {
        this.router.navigate(['/tasks', notification.task], {
          queryParams: {
            project: projectId,
          },
        });

        return;
      }
    }
  }

  formatType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
