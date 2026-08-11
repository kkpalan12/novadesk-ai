import { Component, OnInit, inject, signal } from '@angular/core';

import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace } from '../../../core/models/workspace.model';

@Component({
  selector: 'app-workspace',
  standalone: true,
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
})
export class WorkspaceComponent implements OnInit {
  private readonly workspaceService = inject(WorkspaceService);

  readonly workspaces = signal<Workspace[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  private loadWorkspaces(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.workspaceService.getWorkspaces().subscribe({
      next: (response) => {
        this.workspaces.set(response.data.workspaces);
        this.loading.set(false);
      },

      error: (error) => {
        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load workspaces.',
        );
      },
    });
  }
}
