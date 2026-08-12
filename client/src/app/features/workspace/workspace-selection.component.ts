import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { WorkspaceContextService } from '../../core/services/workspace-context.service';

@Component({
  selector: 'app-workspace-selection',
  standalone: true,

  imports: [CommonModule],

  templateUrl: './workspace-selection.component.html',

  styleUrl: './workspace-selection.component.scss',
})
export class WorkspaceSelectionComponent implements OnInit {
  readonly workspaceContext = inject(WorkspaceContextService);

  private readonly router = inject(Router);

  // =========================================
  // Lifecycle
  // =========================================

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();
  }

  // =========================================
  // Select Workspace
  // =========================================

  selectWorkspace(workspaceId: string): void {
    console.log('Workspace selected:', workspaceId);

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

    // Save active workspace

    this.workspaceContext.selectWorkspace(workspace);

    console.log('Navigating to dashboard:', workspace._id);

    // Navigate with workspace context

    this.router.navigate(['/dashboard'], {
      queryParams: {
        workspace: workspace._id,
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
