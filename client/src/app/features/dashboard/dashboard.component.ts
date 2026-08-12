import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

import {
  DashboardData,
  DashboardService,
} from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [CommonModule],

  templateUrl: './dashboard.component.html',

  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);

  private readonly dashboardService = inject(DashboardService);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  // =========================================
  // User
  // =========================================

  readonly user = this.authService.getCurrentUser();

  // =========================================
  // State
  // =========================================

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  readonly dashboard = signal<DashboardData | null>(null);

  readonly workspaceId = signal('');

  // =========================================
  // Lifecycle
  // =========================================

  ngOnInit(): void {
    const workspaceId = this.route.snapshot.queryParamMap.get('workspace');

    if (workspaceId) {
      this.workspaceId.set(workspaceId);
    }

    this.loadDashboard();
  }

  // =========================================
  // Load Dashboard
  // =========================================

  private loadDashboard(): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.dashboardService.getDashboard().subscribe({
      next: (response) => {
        this.dashboard.set(response.data);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Load dashboard error:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load dashboard.',
        );
      },
    });
  }

  // =========================================
  // Projects
  // =========================================

  goToProjects(): void {
    const workspaceId = this.workspaceId();

    if (!workspaceId) {
      this.errorMessage.set('Workspace is required.');

      return;
    }

    this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspaceId,
      },
    });
  }

  // =========================================
  // Notifications
  // =========================================

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  // =========================================
  // Logout
  // =========================================

  logout(): void {
    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
