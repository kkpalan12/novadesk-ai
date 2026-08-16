import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { NotificationService } from '../../core/services/notification.service';

import { Notification } from '../../core/models/notification.model';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

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

  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  // =========================================
  // State
  // =========================================

  readonly notifications = signal<Notification[]>([]);

  readonly loading = signal(true);

  readonly actionLoading = signal<string | null>(null);

  readonly errorMessage = signal('');

  readonly total = signal(0);

  // =========================================
  // Init
  // =========================================

  ngOnInit(): void {
    this.loadNotifications();
  }

  // =========================================
  // Load Notifications
  // =========================================

  loadNotifications(): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        const notifications = response?.data ?? [];

        this.notifications.set(notifications);

        this.total.set(notifications.length);

        this.loading.set(false);
      },

      error: (error) => {
        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load notifications.',
        );
      },
    });
  }

  // =========================================
  // Mark One As Read
  // =========================================

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
        this.notificationService.refreshUnreadCount();
      },

      error: (error) => {
        this.actionLoading.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to mark notification as read.',
        );
      },
    });
  }

  // =========================================
  // Mark All As Read
  // =========================================

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
        this.notificationService.refreshUnreadCount();
      },

      error: (error) => {
        this.actionLoading.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to mark all notifications as read.',
        );
      },
    });
  }

  // =========================================
  // Delete Notification
  // =========================================

  async deleteNotification(notification: Notification): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete notification?',
      message: 'Are you sure you want to delete this notification?',
      confirmText: 'Delete',
      cancelText: 'Keep',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.actionLoading.set(notification._id);

    this.notificationService.deleteNotification(notification._id).subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.filter((item) => item._id !== notification._id),
        );

        this.actionLoading.set(null);

        this.total.update((value) => Math.max(0, value - 1));
        this.notificationService.refreshUnreadCount();
      },

      error: (error) => {
        this.actionLoading.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to delete notification.',
        );
      },
    });
  }

  // =========================================
  // Open Notification
  // =========================================

  openNotification(notification: Notification): void {
    // Mark as read first
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    // Only task notifications
    if (notification.entityType?.toLowerCase() !== 'task') {
      return;
    }

    if (!notification.entityId) {
      return;
    }

    if (!notification.projectId) {
      return;
    }

    const workspaceId = this.workspaceContext.activeWorkspace()?._id;

    this.router.navigate(['/tasks', notification.entityId], {
      queryParams: {
        project: notification.projectId,

        ...(workspaceId
          ? {
              workspace: workspaceId,
            }
          : {}),
      },
    });
  }

  // =========================================
  // Notification Type
  // =========================================

  formatType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
