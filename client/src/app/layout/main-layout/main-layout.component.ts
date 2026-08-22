import { Component, OnInit, ViewChild, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterOutlet, NavigationEnd } from '@angular/router';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';

import { AuthService } from '../../core/auth/auth.service';

import { NotificationService } from '../../core/services/notification.service';

import { SocketService } from '../../core/services/socket.service';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { filter } from 'rxjs';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Bell,
  Sparkles,
  ChartNoAxesCombined,
  LogOut,
  Search,
  LucideAngularModule,
} from 'lucide-angular';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import { AiAssistantComponent } from '../../shared/components/ai-assistant/ai-assistant.component';
@Component({
  selector: 'app-main-layout',

  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    ConfirmDialogComponent,
    LucideAngularModule,
    CommandPaletteComponent,
    AiAssistantComponent,
  ],

  templateUrl: './main-layout.component.html',

  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  @ViewChild(AiAssistantComponent)
  aiAssistant!: AiAssistantComponent;
  // =========================================
  // SERVICES
  // =========================================

  readonly workspaceContext = inject(WorkspaceContextService);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  private readonly notificationService = inject(NotificationService);

  private readonly socketService = inject(SocketService);

  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly currentUrl = this.router.url;
  activeRoute = '';
  profileMenuOpen = false;
  // =========================================
  // CURRENT USER
  // =========================================

  readonly user = this.authService.getCurrentUser();

  // =========================================
  // NOTIFICATION STATE
  // =========================================

  readonly unreadNotificationCount = this.notificationService.unreadCount;
  readonly icons = {
    dashboard: LayoutDashboard,
    projects: FolderKanban,
    workspace: Building2,
    notifications: Bell,
    ai: Sparkles,
    analytics: ChartNoAxesCombined,
    logout: LogOut,
    search: Search,
  };

  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();

    // Initialize real-time notifications
    this.notificationService.initializeRealtime();

    this.activeRoute = this.router.url;

    this.router.events

      .pipe(filter((event) => event instanceof NavigationEnd))

      .subscribe((event) => {
        const navigation = event as NavigationEnd;

        this.activeRoute = navigation.urlAfterRedirects;
      });
  }

  isActiveRoute(route: string): boolean {
    return this.activeRoute.startsWith(route);
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
    this.profileMenuOpen = false;

    void this.router.navigate(['/settings/profile']);
  }
  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }
  closeProfileMenu(): void {
    this.profileMenuOpen = false;
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
  openProjects(): void {
    this.goToProjects();
  }

  openDashboard(): void {
    this.goToDashboard();
  }

  openWorkspace(): void {
    this.goToWorkspace();
  }

  openProfile(): void {
    this.goToProfile();
  }
  openAiAssistant(): void {
    this.aiAssistant.openPanel();
  }
}
