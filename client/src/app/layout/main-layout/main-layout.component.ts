import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterOutlet } from '@angular/router';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';

import { AuthService } from '../../core/auth/auth.service';

import { NotificationService } from '../../core/services/notification.service';

import { SocketService } from '../../core/services/socket.service';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-main-layout',

  standalone: true,

  imports: [CommonModule, RouterOutlet, ConfirmDialogComponent],

  templateUrl: './main-layout.component.html',

  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  // =========================================
  // SERVICES
  // =========================================

  readonly workspaceContext = inject(WorkspaceContextService);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  private readonly notificationService = inject(NotificationService);

  private readonly socketService = inject(SocketService);

  private readonly confirmDialog = inject(ConfirmDialogService);

  // =========================================
  // CURRENT USER
  // =========================================

  readonly user = this.authService.getCurrentUser();

  // =========================================
  // NOTIFICATION STATE
  // =========================================

  readonly unreadNotificationCount = this.notificationService.unreadCount;

  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();

    // Initialize real-time notifications
    this.notificationService.initializeRealtime();
  }

  // =========================================
  // USER INITIAL
  // =========================================

  get userInitial(): string {
    const currentUser = this.user;

    if (!currentUser) {
      return 'U';
    }

    return currentUser.firstName?.charAt(0)?.toUpperCase() ?? 'U';
  }

  // =========================================
  // WORKSPACE RETRY
  // =========================================

  retryWorkspaces(): void {
    this.workspaceContext.loadWorkspaces();
  }

  // =========================================
  // DASHBOARD
  // =========================================

  goToDashboard(): void {
    const workspace = this.workspaceContext.activeWorkspace();

    if (!workspace) {
      void this.router.navigate(['/workspace/select']);

      return;
    }

    void this.router.navigate(['/dashboard'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  // =========================================
  // PROJECTS
  // =========================================

  goToProjects(): void {
    const workspace = this.workspaceContext.activeWorkspace();

    if (!workspace) {
      void this.router.navigate(['/workspace/select']);

      return;
    }

    void this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  // =========================================
  // WORKSPACE
  // =========================================

  goToWorkspace(): void {
    const workspace = this.workspaceContext.activeWorkspace();

    if (!workspace) {
      void this.router.navigate(['/workspace/select']);

      return;
    }

    void this.router.navigate(['/workspace/manage'], {
      queryParams: {
        workspace: workspace._id,
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
  // SELECT WORKSPACE
  // =========================================
  //
  // IMPORTANT:
  //
  // Workspace switching is a context change.
  //
  // Do NOT keep the current project/task/detail
  // route because that route belongs to the old
  // workspace.
  //
  // Always return to the workspace-level Projects
  // page for the newly selected workspace.
  //
  // This prevents:
  //
  // Workspace A
  //   -> Task A Detail
  //   -> Workspace B
  //   -> Task A remaining visible
  //
  // Instead:
  //
  // Workspace A
  //   -> Task A Detail
  //   -> Workspace B
  //   -> Projects B
  //

  selectWorkspace(workspaceId: string): void {
    if (!workspaceId) {
      return;
    }

    const workspace = this.workspaceContext
      .workspaces()
      .find((item) => item._id === workspaceId);

    if (!workspace) {
      return;
    }

    // =======================================
    // UPDATE ACTIVE WORKSPACE
    // =======================================

    this.workspaceContext.selectWorkspace(workspace);

    // =======================================
    // ALWAYS EXIT PROJECT/TASK CONTEXT
    // =======================================

    void this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspace._id,
      },

      // Replace the old workspace route in
      // browser history so Back does not return
      // to a task from the previous workspace.
      replaceUrl: true,
    });
  }

  // =========================================
  // PROFILE
  // =========================================

  goToProfile(): void {
    void this.router.navigate(['/settings/profile']);
  }

  // =========================================
  // LOGOUT
  // =========================================

  async logout(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Log out of NovaDesk?',

      message: 'Are you sure you want to log out of your account?',

      confirmText: 'Logout',

      cancelText: 'Stay logged in',

      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    // Clear active workspace
    this.workspaceContext.clearWorkspace();

    // Clear notification state
    this.notificationService.clear();

    // Disconnect realtime socket
    this.socketService.disconnect();

    // Clear authentication
    this.authService.logout();

    // Return to login
    void this.router.navigate(['/login']);
  }
}
