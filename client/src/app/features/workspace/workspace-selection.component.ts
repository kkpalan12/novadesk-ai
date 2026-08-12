import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';
import { WorkspaceService } from '../../core/services/workspace.service';

@Component({
  selector: 'app-workspace-selection',
  standalone: true,

  imports: [CommonModule],

  templateUrl: './workspace-selection.component.html',

  styleUrl: './workspace-selection.component.scss',
})
export class WorkspaceSelectionComponent implements OnInit {
  readonly workspaceContext = inject(WorkspaceContextService);

  private readonly workspaceService = inject(WorkspaceService);

  private readonly router = inject(Router);

  readonly creating = signal(false);

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();
  }

  // =========================================
  // Select Workspace
  // =========================================

  selectWorkspace(workspaceId: string): void {
    if (!workspaceId) {
      console.error('Workspace ID is missing.');
      return;
    }

    const workspace = this.workspaceContext
      .workspaces()
      .find((item) => item._id === workspaceId);

    if (!workspace) {
      console.error('Workspace not found:', workspaceId);
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
  // Create Workspace
  // =========================================

  createWorkspace(): void {
    const name = window.prompt('Enter workspace name');

    if (!name?.trim()) {
      return;
    }

    this.creating.set(true);

    this.workspaceService
      .createWorkspace({
        name: name.trim(),
      })
      .subscribe({
        next: (response) => {
          const workspace = response.data;

          this.workspaceContext.selectWorkspace(workspace);

          this.creating.set(false);

          this.router.navigate(['/dashboard'], {
            queryParams: {
              workspace: workspace._id,
            },
          });
        },

        error: (error) => {
          console.error('Create workspace error:', error);

          this.creating.set(false);
        },
      });
  }

  // =========================================
  // Retry
  // =========================================

  retry(): void {
    this.workspaceContext.loadWorkspaces();
  }
}
