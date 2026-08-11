import { Component, OnInit, inject } from '@angular/core';

import { Router, RouterOutlet } from '@angular/router';

import { WorkspaceContextService } from '../../../core/services/workspace-context.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  private readonly router = inject(Router);

  readonly workspaceContext = inject(WorkspaceContextService);

  // =========================================
  // Lifecycle
  // =========================================

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();
  }

  // =========================================
  // Dashboard
  // =========================================

  goToDashboard(): void {
    const workspace = this.workspaceContext.activeWorkspace();

    if (!workspace) {
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
      return;
    }

    this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  // =========================================
  // Tasks
  // =========================================

  goToTasks(): void {
    const project = this.getQueryParam('project');

    const workspace = this.workspaceContext.activeWorkspace();

    if (!project || !workspace) {
      return;
    }

    this.router.navigate(['/tasks'], {
      queryParams: {
        project,

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
  // Workspace Selection
  // =========================================

  selectWorkspace(workspaceId: string): void {
    const workspace = this.workspaceContext
      .workspaces()
      .find((item) => item._id === workspaceId);

    if (!workspace) {
      return;
    }

    this.workspaceContext.selectWorkspace(workspace);
  }

  // =========================================
  // Logout
  // =========================================

  logout(): void {
    localStorage.removeItem('accessToken');

    localStorage.removeItem('refreshToken');

    this.router.navigate(['/login']);
  }

  // =========================================
  // Query Param
  // =========================================

  private getQueryParam(name: string): string | null {
    const url = this.router.url;

    const questionMark = url.indexOf('?');

    if (questionMark === -1) {
      return null;
    }

    const queryString = url.substring(questionMark + 1);

    const params = new URLSearchParams(queryString);

    return params.get(name);
  }
}
