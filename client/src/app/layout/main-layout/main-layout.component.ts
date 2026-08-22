import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterOutlet, NavigationEnd } from '@angular/router';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SocketService } from '../../core/services/socket.service';
import { ApiService } from '../../core/services/api.service';

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

/* =========================================================
   SEARCH TYPES
   ========================================================= */

interface SearchResultItem {
  _id?: string;
  id?: string;

  firstName?: string;
  lastName?: string;
  email?: string;

  name?: string;
  title?: string;
  description?: string;
  content?: string;

  workspace?:
    | {
        _id?: string;
        name?: string;
      }
    | string;

  project?:
    | {
        _id?: string;
        name?: string;
      }
    | string;

  task?:
    | {
        _id?: string;
        title?: string;
      }
    | string;

  createdBy?:
    | {
        _id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      }
    | string;
}

interface SearchCollection<T = SearchResultItem> {
  items: T[];
  total: number;
}

interface GlobalSearchResponse {
  success: boolean;
  message: string;

  data: {
    query: string;

    users: SearchCollection;
    workspaces: SearchCollection;
    projects: SearchCollection;
    tasks: SearchCollection;
    comments: SearchCollection;

    total: number;
  };
}

type SearchResultType = 'user' | 'workspace' | 'project' | 'task' | 'comment';

interface SearchDisplayResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;

  workspaceId?: string;
  projectId?: string;
  taskId?: string;
}

/* =========================================================
   COMPONENT
   ========================================================= */

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
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild(AiAssistantComponent)
  aiAssistant!: AiAssistantComponent;

  /* =======================================================
     SERVICES
     ======================================================= */

  readonly workspaceContext = inject(WorkspaceContextService);

  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

  private readonly notificationService = inject(NotificationService);

  private readonly socketService = inject(SocketService);

  private readonly confirmDialog = inject(ConfirmDialogService);

  private readonly api = inject(ApiService);

  /* =======================================================
     ROUTE
     ======================================================= */

  readonly currentUrl = this.router.url;

  activeRoute = '';

  profileMenuOpen = false;

  /* =======================================================
     CURRENT USER
     ======================================================= */

  readonly user = this.authService.getCurrentUser();

  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  readonly unreadNotificationCount = this.notificationService.unreadCount;

  /* =======================================================
     ICONS
     ======================================================= */

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

  /* =======================================================
     GLOBAL SEARCH
     ======================================================= */

  searchQuery = '';

  searchOpen = false;

  searchLoading = false;

  searchResults: SearchDisplayResult[] = [];

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  /* =======================================================
     INIT
     ======================================================= */

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();

    this.notificationService.initializeRealtime();

    this.activeRoute = this.router.url;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigation = event as NavigationEnd;

        this.activeRoute = navigation.urlAfterRedirects;
      });
  }

  /* =======================================================
     SEARCH INPUT
     ======================================================= */

  onSearchInput(value: string): void {
    this.searchQuery = value;

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    const query = value.trim();

    if (!query) {
      this.searchResults = [];
      this.searchOpen = false;
      this.searchLoading = false;
      return;
    }

    this.searchOpen = true;
    this.searchLoading = true;

    this.searchDebounceTimer = setTimeout(() => {
      this.performGlobalSearch(query);
    }, 300);
  }

  /* =======================================================
     SEARCH API
     ======================================================= */

  private performGlobalSearch(query: string): void {
    const encodedQuery = encodeURIComponent(query);

    this.api.get<GlobalSearchResponse>(`/search?q=${encodedQuery}`).subscribe({
      next: (response) => {
        if (!response?.success || !response.data) {
          this.searchResults = [];
          this.searchLoading = false;
          return;
        }

        this.searchResults = this.buildSearchResults(response.data);

        this.searchLoading = false;
        this.searchOpen = true;
      },

      error: (error) => {
        console.error('NovaDesk global search error:', error);

        this.searchResults = [];
        this.searchLoading = false;
        this.searchOpen = true;
      },
    });
  }

  /* =======================================================
     BUILD SEARCH RESULTS
     ======================================================= */

  private buildSearchResults(
    data: GlobalSearchResponse['data'],
  ): SearchDisplayResult[] {
    const results: SearchDisplayResult[] = [];

    /* -----------------------------------------------
       PROJECTS
       ----------------------------------------------- */

    for (const project of data.projects?.items ?? []) {
      const id = this.getId(project);

      if (!id) {
        continue;
      }

      results.push({
        id,
        type: 'project',

        title: project.name ?? project.title ?? 'Untitled Project',

        subtitle: project.description ?? 'Project',

        workspaceId: this.getNestedId(project.workspace),
      });
    }

    /* -----------------------------------------------
       TASKS
       ----------------------------------------------- */

    for (const task of data.tasks?.items ?? []) {
      const id = this.getId(task);

      if (!id) {
        continue;
      }

      const projectId = this.getNestedId(task.project);

      const projectName = this.getNestedName(task.project);

      results.push({
        id,
        type: 'task',

        title: task.title ?? 'Untitled Task',

        subtitle: projectName ? `Task • ${projectName}` : 'Task',

        projectId,
      });
    }

    /* -----------------------------------------------
       WORKSPACES
       ----------------------------------------------- */

    for (const workspace of data.workspaces?.items ?? []) {
      const id = this.getId(workspace);

      if (!id) {
        continue;
      }

      results.push({
        id,
        type: 'workspace',

        title: workspace.name ?? 'Untitled Workspace',

        subtitle: workspace.description ?? 'Workspace',
      });
    }

    /* -----------------------------------------------
       USERS
       ----------------------------------------------- */

    for (const user of data.users?.items ?? []) {
      const id = this.getId(user);

      if (!id) {
        continue;
      }

      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ');

      results.push({
        id,
        type: 'user',

        title: fullName || user.email || 'User',

        subtitle: user.email ?? 'User',
      });
    }

    /* -----------------------------------------------
       COMMENTS
       ----------------------------------------------- */

    for (const comment of data.comments?.items ?? []) {
      const id = this.getId(comment);

      if (!id) {
        continue;
      }

      const taskId = this.getNestedId(comment.task);

      const taskTitle = this.getNestedName(comment.task);

      results.push({
        id,
        type: 'comment',

        title: comment.content ?? 'Comment',

        subtitle: taskTitle ? `Comment • ${taskTitle}` : 'Comment',

        taskId,
      });
    }

    return results;
  }

  /* =======================================================
     SEARCH HELPERS
     ======================================================= */

  private getId(item: SearchResultItem): string {
    return item._id ?? item.id ?? '';
  }

  private getNestedId(
    value:
      | {
          _id?: string;
          name?: string;
          title?: string;
        }
      | string
      | undefined,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    return value._id;
  }

  private getNestedName(
    value:
      | {
          _id?: string;
          name?: string;
          title?: string;
        }
      | string
      | undefined,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      return undefined;
    }

    return value.name ?? value.title;
  }

  /* =======================================================
     SEARCH RESULT CLICK
     ======================================================= */

  openSearchResult(result: SearchDisplayResult): void {
    if (!result.id) {
      return;
    }

    this.closeSearch();

    const workspace = this.workspaceContext.activeWorkspace();

    const workspaceId = result.workspaceId ?? workspace?._id;

    switch (result.type) {
      case 'project':
        void this.router.navigate(['/projects'], {
          queryParams: {
            workspace: workspaceId,
            project: result.id,
          },
        });
        break;

      case 'task':
        void this.router.navigate(['/tasks', result.id], {
          queryParams: {
            workspace: workspaceId,
            project: result.projectId,
          },
        });
        break;

      case 'workspace':
        void this.router.navigate(['/workspace/manage'], {
          queryParams: {
            workspace: result.id,
          },
        });
        break;

      case 'user':
        void this.router.navigate(['/settings/profile']);
        break;

      case 'comment':
        if (result.taskId) {
          void this.router.navigate(['/tasks', result.taskId], {
            queryParams: {
              workspace: workspaceId,
            },
          });
        }
        break;
    }
  }

  /* =======================================================
     CLOSE SEARCH
     ======================================================= */

  closeSearch(): void {
    this.searchOpen = false;
    this.searchResults = [];
  }

  /* =======================================================
     SEARCH KEYBOARD
     ======================================================= */

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSearch();

      return;
    }

    if (event.key === 'Enter' && this.searchResults.length > 0) {
      this.openSearchResult(this.searchResults[0]);
    }
  }

  /* =======================================================
     USER INITIAL
     ======================================================= */

  get userInitial(): string {
    const currentUser = this.user;

    if (!currentUser) {
      return 'U';
    }

    return currentUser.firstName?.charAt(0)?.toUpperCase() ?? 'U';
  }

  /* =======================================================
     ROUTING
     ======================================================= */

  isActiveRoute(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }

  /* =======================================================
     WORKSPACE RETRY
     ======================================================= */

  retryWorkspaces(): void {
    this.workspaceContext.loadWorkspaces();
  }

  /* =======================================================
     DASHBOARD
     ======================================================= */

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

  /* =======================================================
     PROJECTS
     ======================================================= */

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

  /* =======================================================
     WORKSPACE
     ======================================================= */

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

  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  goToNotifications(): void {
    void this.router.navigate(['/notifications']);
  }

  /* =======================================================
     SELECT WORKSPACE
     ======================================================= */

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

    this.workspaceContext.selectWorkspace(workspace);

    void this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspace._id,
      },
      replaceUrl: true,
    });
  }

  /* =======================================================
     PROFILE
     ======================================================= */

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

  /* =======================================================
     LOGOUT
     ======================================================= */

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

    this.workspaceContext.clearWorkspace();

    this.notificationService.clear();

    this.socketService.disconnect();

    this.authService.logout();

    void this.router.navigate(['/login']);
  }

  /* =======================================================
     COMMAND PALETTE
     ======================================================= */

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

  /* =======================================================
     DESTROY
     ======================================================= */

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }
}
