import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterOutlet } from '@angular/router';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,

  imports: [CommonModule, RouterOutlet],

  templateUrl: './main-layout.component.html',

  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  readonly workspaceContext = inject(WorkspaceContextService);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  readonly user = this.authService.getCurrentUser();
  private readonly notificationService = inject(NotificationService);

  readonly unreadNotificationCount = this.notificationService.unreadCount;

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();

    this.notificationService.refreshUnreadCount();
  }

  get userInitial(): string {
    const currentUser = this.user;

    if (!currentUser) {
      return 'U';
    }

    return currentUser.firstName?.charAt(0)?.toUpperCase() ?? 'U';
  }

  goToDashboard(): void {
    const workspace = this.workspaceContext.activeWorkspace();

    if (!workspace) {
      this.router.navigate(['/workspace/select']);

      return;
    }

    this.router.navigate(['/dashboard'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  goToProjects(): void {
    const workspace = this.workspaceContext.activeWorkspace();

    if (!workspace) {
      this.router.navigate(['/workspace/select']);

      return;
    }

    this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  goToWorkspace(): void {
    const workspace = this.workspaceContext.activeWorkspace();

    if (!workspace) {
      this.router.navigate(['/workspace/select']);

      return;
    }

    this.router.navigate(['/workspace/manage'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  selectWorkspace(workspaceId: string): void {
    const workspace = this.workspaceContext
      .workspaces()
      .find((item) => item._id === workspaceId);

    if (!workspace) {
      return;
    }

    this.workspaceContext.selectWorkspace(workspace);

    this.router.navigate(['/dashboard'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  logout(): void {
    this.workspaceContext.clearWorkspace();

    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
