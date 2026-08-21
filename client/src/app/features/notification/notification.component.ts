import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  // STATE
  // =========================================

  readonly notifications = this.notificationService.notifications;

  readonly total = computed(() => this.notifications().length);

  readonly hasUnread = computed(() =>
    this.notifications().some((notification) => !notification.isRead),
  );

  readonly loading = signal(true);

  readonly actionLoading = signal<string | null>(null);

  readonly errorMessage = signal('');

  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {
    this.notificationService.initializeRealtime();

    this.loadNotifications();
  }

  // =========================================
  // LOAD
  // =========================================

  loadNotifications(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        this.notificationService.setNotifications(response?.data ?? []);

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
  // MARK ONE READ
  // =========================================

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    if (this.actionLoading()) {
      return;
    }

    this.actionLoading.set(notification._id);

    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        this.notificationService.markNotificationReadLocally(notification._id);

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
  // MARK ALL READ
  // =========================================

  markAllAsRead(): void {
    if (!this.hasUnread()) {
      return;
    }

    if (this.actionLoading()) {
      return;
    }

    this.actionLoading.set('all');

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notificationService.markAllNotificationsReadLocally();

        this.actionLoading.set(null);
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
  // DELETE
  // =========================================

  async deleteNotification(notification: Notification): Promise<void> {
    if (this.actionLoading()) {
      return;
    }

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
        this.notificationService.removeNotification(notification._id);

        this.actionLoading.set(null);
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
  // OPEN
  // =========================================

  openNotification(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

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
  // FORMAT TYPE
  // =========================================

  formatType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
