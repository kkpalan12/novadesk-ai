import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

import { SocketService } from '../../core/services/socket.service';

import { Activity } from '../../core/models/activity.model';

import {
  DashboardData,
  DashboardService,
} from '../../core/services/dashboard.service';

import { Subject } from 'rxjs';

import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './dashboard.component.html',

  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  // =========================================
  // SERVICES
  // =========================================

  private readonly authService = inject(AuthService);

  private readonly dashboardService = inject(DashboardService);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  private readonly socketService = inject(SocketService);

  // =========================================
  // DESTROY
  // =========================================

  private readonly destroy$ = new Subject<void>();

  // =========================================
  // USER
  // =========================================

  readonly user = this.authService.getCurrentUser();

  // =========================================
  // STATE
  // =========================================

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  readonly dashboard = signal<DashboardData | null>(null);

  readonly workspaceId = signal('');

  // =========================================
  // LIFECYCLE
  // =========================================

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

  // =========================================
  // WORKSPACE CHANGE
  // =========================================

  private handleWorkspaceChange(workspaceId: string): void {
    // Leave previous workspace socket room
    const previousWorkspaceId = this.workspaceId();

    if (previousWorkspaceId && previousWorkspaceId !== workspaceId) {
      this.socketService.leaveWorkspace(previousWorkspaceId);

      this.socketService.removeActivityListeners();
    }

    // Update current workspace
    this.workspaceId.set(workspaceId);

    // Clear old workspace data immediately
    this.dashboard.set(null);

    this.errorMessage.set('');

    this.loading.set(true);

    // Join new workspace
    this.initializeRealtime(workspaceId);

    // Load new workspace dashboard
    this.loadDashboard();
  }

  // =========================================
  // REALTIME
  // =========================================

  private initializeRealtime(workspaceId: string): void {
    this.socketService.connect();

    this.socketService.joinWorkspace(workspaceId);

    this.socketService.onActivityCreated((activity: Activity) => {
      if (!activity?._id) {
        return;
      }

      // =====================================
      // TASK ACTIVITY
      // =====================================

      if (
        activity.action === 'TASK_CREATED' ||
        activity.action === 'TASK_UPDATED' ||
        activity.action === 'TASK_STATUS_CHANGED' ||
        activity.action === 'TASK_DELETED'
      ) {
        this.loadDashboard();

        return;
      }

      // =====================================
      // OTHER ACTIVITY
      // =====================================

      this.dashboard.update((current) => {
        if (!current) {
          return current;
        }

        const exists = current.recentActivities.some(
          (item: any) => item?._id === activity._id,
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

  // =========================================
  // LOAD DASHBOARD
  // =========================================

  private loadDashboard(): void {
    const workspaceId = this.workspaceId();

    if (!workspaceId) {
      return;
    }

    this.loading.set(true);

    this.errorMessage.set('');

    this.dashboardService.getDashboard().subscribe({
      next: (response) => {
        // Ignore a response that belongs
        // to an old workspace request.

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

  // =========================================
  // PROJECTS
  // =========================================

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

  // =========================================
  // NOTIFICATIONS
  // =========================================

  goToNotifications(): void {
    void this.router.navigate(['/notifications']);
  }

  // =========================================
  // LOGOUT
  // =========================================

  logout(): void {
    this.authService.logout();

    void this.router.navigate(['/login']);
  }

  // =========================================
  // DESTROY
  // =========================================

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
