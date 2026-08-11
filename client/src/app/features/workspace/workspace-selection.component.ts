import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { WorkspaceContextService } from '../../../core/services/workspace-context.service';

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

  ngOnInit(): void {
    this.workspaceContext.loadWorkspaces();
  }

  selectWorkspace(workspaceId: string): void {
    const workspace = this.workspaceContext
      .workspaces()
      .find((item) => item._id === workspaceId);

    if (!workspace) {
      return;
    }

    this.workspaceContext.selectWorkspace(workspace);
  }

  retry(): void {
    this.workspaceContext.loadWorkspaces();
  }
}
