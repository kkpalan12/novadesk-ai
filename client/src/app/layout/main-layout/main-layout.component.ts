import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,

  imports: [CommonModule, RouterOutlet],

  templateUrl: './main-layout.component.html',

  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  // =========================================
  // Services
  // =========================================

  readonly workspaceContext = inject(WorkspaceContextService);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  private readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);

  // =========================================
  // Current User
  // =========================================

  readonly user = this.authService.getCurrentUser();

  // =========================================
  // Notification State
  // =========================================

  readonly unreadNotificationCount = this.notificationService.unreadCount;

  // =========================================
  // Init
  // =========================================

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();

    // Initialize real-time notifications
    this.notificationService.initializeRealtime();
  }

  // =========================================
  // User Initial
  // =========================================

  get userInitial(): string {
    const currentUser = this.user;

    if (!currentUser) {
      return 'U';
    }

    return currentUser.firstName?.charAt(0)?.toUpperCase() ?? 'U';
  }

  // =========================================
  // Dashboard
  // =========================================

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

  // =========================================
  // Projects
  // =========================================

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

  // =========================================
  // Workspace
  // =========================================

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

  // =========================================
  // Notifications
  // =========================================

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  // =========================================
  // Select Workspace
  // =========================================

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

  // =========================================
  // Profile
  // =========================================

  goToProfile(): void {
    this.router.navigate(['/settings/profile']);
  }

  // =========================================
  // Logout
  // =========================================

  logout(): void {
    this.workspaceContext.clearWorkspace();

    this.notificationService.clear();

    // Disconnect realtime socket
    this.socketService.disconnect();

    // Clear authentication
    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
