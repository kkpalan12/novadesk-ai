import { Injectable, inject, signal } from '@angular/core';

import { Workspace } from '../models/workspace.model';
import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceContextService {
  // =========================================
  // SERVICES
  // =========================================

  private readonly workspaceService = inject(WorkspaceService);

  // =========================================
  // STORAGE
  // =========================================

  private readonly activeWorkspaceKey = 'activeWorkspaceId';

  // =========================================
  // STATE
  // =========================================

  readonly workspaces = signal<Workspace[]>([]);

  readonly activeWorkspace = signal<Workspace | null>(null);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  // =========================================
  // LOAD WORKSPACES
  // =========================================

  loadWorkspaces(): void {
    /*
     * Prevent duplicate requests.
     */
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.workspaceService.getWorkspaces().subscribe({
      // =====================================
      // SUCCESS
      // =====================================

      next: (response) => {
        const workspaces = response?.data?.workspaces ?? [];

        this.workspaces.set(workspaces);

        // ===================================
        // NO WORKSPACES
        // ===================================

        if (workspaces.length === 0) {
          this.activeWorkspace.set(null);

          localStorage.removeItem(this.activeWorkspaceKey);

          this.loading.set(false);

          return;
        }

        // ===================================
        // RESTORE SAVED WORKSPACE
        // ===================================

        const savedWorkspaceId = localStorage.getItem(this.activeWorkspaceKey);

        const savedWorkspace = savedWorkspaceId
          ? (workspaces.find(
              (workspace) => workspace._id === savedWorkspaceId,
            ) ?? null)
          : null;

        // ===================================
        // VALID SAVED WORKSPACE
        // ===================================

        if (savedWorkspace) {
          this.activeWorkspace.set(savedWorkspace);

          this.loading.set(false);

          return;
        }

        // ===================================
        // INVALID / REMOVED WORKSPACE
        // ===================================

        const firstWorkspace = workspaces[0];

        this.activeWorkspace.set(firstWorkspace);

        localStorage.setItem(this.activeWorkspaceKey, firstWorkspace._id);

        this.loading.set(false);
      },

      // =====================================
      // ERROR
      // =====================================

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
  // SELECT WORKSPACE
  // =========================================

  selectWorkspace(workspace: Workspace): void {
    if (!workspace?._id) {
      return;
    }

    /*
     * Only allow selection from the
     * currently loaded workspace list.
     */
    const availableWorkspace = this.workspaces().find(
      (item) => item._id === workspace._id,
    );

    if (!availableWorkspace) {
      return;
    }

    this.activeWorkspace.set(availableWorkspace);

    localStorage.setItem(this.activeWorkspaceKey, availableWorkspace._id);
  }

  // =========================================
  // SELECT WORKSPACE BY ID
  // =========================================

  selectWorkspaceById(workspaceId: string): void {
    if (!workspaceId) {
      return;
    }

    const workspace = this.workspaces().find(
      (item) => item._id === workspaceId,
    );

    if (!workspace) {
      return;
    }

    this.selectWorkspace(workspace);
  }

  // =========================================
  // GET ACTIVE WORKSPACE
  // =========================================

  getActiveWorkspace(): Workspace | null {
    return this.activeWorkspace();
  }

  // =========================================
  // GET ACTIVE WORKSPACE ID
  // =========================================

  getActiveWorkspaceId(): string | null {
    return this.activeWorkspace()?._id ?? null;
  }

  // =========================================
  // HAS ACTIVE WORKSPACE
  // =========================================

  hasActiveWorkspace(): boolean {
    return !!this.activeWorkspace();
  }

  // =========================================
  // CLEAR WORKSPACE
  // =========================================

  clearWorkspace(): void {
    this.activeWorkspace.set(null);

    localStorage.removeItem(this.activeWorkspaceKey);
  }
}
