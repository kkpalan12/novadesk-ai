import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { SocketService } from '../../core/services/socket.service';

import {
  DashboardData,
  DashboardService,
} from '../../core/services/dashboard.service';

import { Activity } from '../../core/models/activity.model';
import { Task } from '../../core/models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly socketService = inject(SocketService);

  private readonly destroy$ = new Subject<void>();

  readonly user = this.authService.getCurrentUser();

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly dashboard = signal<DashboardData | null>(null);
  readonly workspaceId = signal('');

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('workspace')),
        filter((workspaceId): workspaceId is string => !!workspaceId),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((workspaceId) => {
        this.handleWorkspaceChange(workspaceId);
      });
  }

  private handleWorkspaceChange(workspaceId: string): void {
    const previousWorkspaceId = this.workspaceId();

    if (previousWorkspaceId && previousWorkspaceId !== workspaceId) {
      this.socketService.leaveWorkspace(previousWorkspaceId);
      this.socketService.removeActivityListeners();
    }

    this.workspaceId.set(workspaceId);
    this.dashboard.set(null);
    this.errorMessage.set('');
    this.loading.set(true);

    this.initializeRealtime(workspaceId);
    this.loadDashboard();
  }

  private initializeRealtime(workspaceId: string): void {
    this.socketService.connect();
    this.socketService.joinWorkspace(workspaceId);

    this.socketService.onActivityCreated((activity: Activity) => {
      if (!activity?._id) {
        return;
      }

      if (
        activity.action === 'TASK_CREATED' ||
        activity.action === 'TASK_UPDATED' ||
        activity.action === 'TASK_STATUS_CHANGED' ||
        activity.action === 'TASK_DELETED'
      ) {
        this.loadDashboard();
        return;
      }

      this.dashboard.update((current) => {
        if (!current) {
          return current;
        }

        const exists = current.recentActivities.some(
          (item) => item?._id === activity._id,
        );

        if (exists) {
          return current;
        }

        return {
          ...current,
          recentActivities: [activity, ...current.recentActivities].slice(
            0,
            10,
          ),
        };
      });
    });
  }

  private loadDashboard(): void {
    const workspaceId = this.workspaceId();

    if (!workspaceId) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getDashboard().subscribe({
      next: (response) => {
        if (this.workspaceId() !== workspaceId) {
          return;
        }

        this.dashboard.set(response.data);
        this.loading.set(false);
      },

      error: (error) => {
        if (this.workspaceId() !== workspaceId) {
          return;
        }

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load dashboard.',
        );
      },
    });
  }

  // =========================================================
  // USER
  // =========================================================

  getFirstName(): string {
    return this.user?.firstName ?? '';
  }

  getUserInitials(): string {
    const first = this.user?.firstName?.charAt(0) ?? '';
    const last = this.user?.lastName?.charAt(0) ?? '';

    return `${first}${last}`.toUpperCase();
  }

  // =========================================================
  // KPI
  // =========================================================

  getCompletionRate(): number {
    const tasks = this.dashboard()?.tasks;

    if (!tasks?.total) {
      return 0;
    }

    return Math.round((tasks.DONE / tasks.total) * 100);
  }

  getActiveTasks(): number {
    const tasks = this.dashboard()?.tasks;

    if (!tasks) {
      return 0;
    }

    return tasks.IN_PROGRESS + tasks.REVIEW;
  }

  // =========================================================
  // STATUS
  // =========================================================

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      TODO: 'To Do',
      IN_PROGRESS: 'In Progress',
      REVIEW: 'Review',
      DONE: 'Done',
    };

    return labels[status] ?? status;
  }

  getStatusPercentage(status: string): number {
    const tasks = this.dashboard()?.tasks;

    if (!tasks?.total) {
      return 0;
    }

    const value = tasks[status as keyof typeof tasks];

    if (typeof value !== 'number') {
      return 0;
    }

    return Math.round((value / tasks.total) * 100);
  }

  // =========================================================
  // PRIORITY
  // =========================================================

  getPriorityPercentage(priority: string): number {
    const priorities = this.dashboard()?.priorities;

    if (!priorities) {
      return 0;
    }

    const total =
      priorities.LOW +
      priorities.MEDIUM +
      priorities.HIGH +
      priorities.CRITICAL;

    if (!total) {
      return 0;
    }

    const value = priorities[priority as keyof typeof priorities];

    return Math.round((value / total) * 100);
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical',
    };

    return labels[priority] ?? priority;
  }

  // =========================================================
  // TASK
  // =========================================================

  getTaskAssigneeName(task: Task): string {
    const assigned = task.assignedTo;

    if (!assigned || typeof assigned === 'string') {
      return '';
    }

    return `${assigned.firstName} ${assigned.lastName}`;
  }

  getTaskInitials(task: Task): string {
    const assigned = task.assignedTo;

    if (!assigned || typeof assigned === 'string') {
      return '';
    }

    return (
      `${assigned.firstName?.charAt(0) ?? ''}` +
      `${assigned.lastName?.charAt(0) ?? ''}`
    ).toUpperCase();
  }

  formatDueDate(task: Task): string {
    if (!task.dueDate) {
      return '';
    }

    const date = new Date(task.dueDate);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }

  // =========================================================
  // ACTIVITY
  // =========================================================

  getActivityUserName(activity: Activity): string {
    const user = activity.user;

    if (!user) {
      return 'Someone';
    }

    if (typeof user === 'string') {
      return 'A user';
    }

    return (
      (`${user.firstName ?? ''} ` + `${user.lastName ?? ''}`).trim() ||
      'Someone'
    );
  }

  getActivityCategory(activity: Activity): string {
    const type = activity.entityType?.toLowerCase();

    if (type === 'task') {
      return 'Task';
    }

    if (type === 'comment') {
      return 'Comment';
    }

    if (type === 'project') {
      return 'Project';
    }

    if (type === 'attachment') {
      return 'Attachment';
    }

    return 'Workspace';
  }

  getActivityIcon(activity: Activity): string {
    const type = activity.entityType?.toLowerCase();

    if (type === 'task') {
      return '✓';
    }

    if (type === 'comment') {
      return '•••';
    }

    if (type === 'attachment') {
      return '↗';
    }

    if (type === 'project') {
      return '◆';
    }

    return '•';
  }

  getActivityDescription(activity: Activity): string {
    const action = activity.action;

    const descriptions: Record<string, string> = {
      TASK_CREATED: 'created a task',
      TASK_UPDATED: 'updated a task',
      TASK_STATUS_CHANGED: 'changed a task status',
      TASK_DELETED: 'deleted a task',
      COMMENT_CREATED: 'added a comment',
      COMMENT_UPDATED: 'updated a comment',
      ATTACHMENT_UPLOADED: 'uploaded an attachment',
      PROJECT_CREATED: 'created a project',
      PROJECT_UPDATED: 'updated a project',
      PROJECT_DELETED: 'deleted a project',
    };

    return descriptions[action] ?? this.humanizeAction(action);
  }

  formatActivityAction(value: string): string {
    return this.humanizeAction(value);
  }

  private humanizeAction(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  getActivityTarget(activity: Activity): string {
    const metadata = activity.metadata;

    if (!metadata) {
      return '';
    }

    const possibleKeys = [
      'title',
      'taskTitle',
      'projectName',
      'name',
      'entityName',
    ];

    for (const key of possibleKeys) {
      const value = metadata[key];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return '';
  }

  getActivityStatusText(activity: Activity): string {
    if (activity.action !== 'TASK_STATUS_CHANGED') {
      return '';
    }

    const metadata = activity.metadata;

    if (!metadata) {
      return '';
    }

    const value = metadata['newStatus'] ?? metadata['status'];

    if (typeof value !== 'string') {
      return '';
    }

    return this.getStatusLabel(value);
  }

  getActivityRelativeTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = Date.now();

    const difference = now - date.getTime();

    const seconds = Math.floor(difference / 1000);

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  goToProjects(): void {
    const workspaceId = this.workspaceId();

    if (!workspaceId) {
      this.errorMessage.set('Workspace is required.');
      return;
    }

    void this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspaceId,
      },
    });
  }

  goToTasks(): void {
    const workspaceId = this.workspaceId();

    void this.router.navigate(['/tasks'], {
      queryParams: {
        workspace: workspaceId,
      },
    });
  }

  goToNotifications(): void {
    void this.router.navigate(['/notifications']);
  }

  openTask(task: Task): void {
    const workspaceId = this.workspaceId();

    void this.router.navigate(['/tasks', task._id], {
      queryParams: {
        workspace: workspaceId,
        project:
          typeof task.project === 'string' ? task.project : task.project?._id,
      },
    });
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {
    this.authService.logout();

    void this.router.navigate(['/login']);
  }

  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    const workspaceId = this.workspaceId();

    if (workspaceId) {
      this.socketService.leaveWorkspace(workspaceId);
    }

    this.socketService.removeActivityListeners();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
