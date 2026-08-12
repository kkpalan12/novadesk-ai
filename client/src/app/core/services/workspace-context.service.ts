import { Injectable, inject, signal } from '@angular/core';

import { Workspace } from '../models/workspace.model';

import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceContextService {
  private readonly workspaceService = inject(WorkspaceService);

  // =========================================
  // State
  // =========================================

  readonly workspaces = signal<Workspace[]>([]);

  readonly activeWorkspace = signal<Workspace | null>(null);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  // =========================================
  // Load Workspaces
  // =========================================

  loadWorkspaces(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    this.errorMessage.set('');

    this.workspaceService.getWorkspaces().subscribe({
      next: (response) => {
        const workspaces = response?.data?.workspaces ?? [];

        this.workspaces.set(workspaces);

        const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');

        if (savedWorkspaceId) {
          const workspace = workspaces.find(
            (item) => item._id === savedWorkspaceId,
          );

          if (workspace) {
            this.activeWorkspace.set(workspace);
          }
        }

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Load workspaces error:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load workspaces.',
        );
      },
    });
  }

  // =========================================
  // Select Workspace
  // =========================================

  selectWorkspace(workspace: Workspace): void {
    this.activeWorkspace.set(workspace);

    localStorage.setItem('activeWorkspaceId', workspace._id);
  }

  // =========================================
  // Get Active Workspace
  // =========================================

  getActiveWorkspace(): Workspace | null {
    return this.activeWorkspace();
  }

  // =========================================
  // Clear Workspace
  // =========================================

  clearWorkspace(): void {
    this.activeWorkspace.set(null);

    localStorage.removeItem('activeWorkspaceId');
  }
}
