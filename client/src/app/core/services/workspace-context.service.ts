import { Injectable, inject, signal } from '@angular/core';

import { Router } from '@angular/router';

import { WorkspaceService } from './workspace.service';

import { Workspace } from '../models/workspace.model';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceContextService {
  private readonly workspaceService = inject(WorkspaceService);

  private readonly router = inject(Router);

  // =========================================
  // State
  // =========================================

  readonly workspaces = signal<Workspace[]>([]);

  readonly activeWorkspace = signal<Workspace | null>(null);

  readonly loading = signal(false);

  readonly error = signal('');

  // =========================================
  // Load Workspaces
  // =========================================

  loadWorkspaces(): void {
    this.loading.set(true);

    this.error.set('');

    this.workspaceService.getWorkspaces().subscribe({
      next: (response) => {
        /*
         * Backend response:
         *
         * data: {
         *   workspaces: [...]
         *   total: 1
         *   page: 1
         * }
         */

        const workspaces = response.data?.workspaces ?? [];

        this.workspaces.set(workspaces);

        this.resolveActiveWorkspace(workspaces);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Load workspaces error:', error);

        this.loading.set(false);

        this.error.set(error?.error?.message ?? 'Unable to load workspaces.');
      },
    });
  }

  // =========================================
  // Select Workspace
  // =========================================

  selectWorkspace(workspace: Workspace): void {
    this.activeWorkspace.set(workspace);

    this.router.navigate(['/dashboard'], {
      queryParams: {
        workspace: workspace._id,
      },
    });
  }

  // =========================================
  // Resolve Active Workspace
  // =========================================

  private resolveActiveWorkspace(workspaces: Workspace[]): void {
    if (!workspaces.length) {
      this.activeWorkspace.set(null);
      return;
    }

    const workspaceId = this.getWorkspaceIdFromUrl();

    if (workspaceId) {
      const workspace = workspaces.find((item) => item._id === workspaceId);

      if (workspace) {
        this.activeWorkspace.set(workspace);

        return;
      }
    }

    // No workspace selected.
    // The user must explicitly select one.
    this.activeWorkspace.set(null);
  }
  // =========================================
  // Get Workspace ID From URL
  // =========================================

  private getWorkspaceIdFromUrl(): string | null {
    const url = this.router.url;

    const questionMark = url.indexOf('?');

    if (questionMark === -1) {
      return null;
    }

    const queryString = url.substring(questionMark + 1);

    const params = new URLSearchParams(queryString);

    return params.get('workspace');
  }
}
