import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { ProjectService } from '../../../core/services/project.service';

import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
})
export class ProjectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly projectService = inject(ProjectService);

  // =========================================
  // State
  // =========================================

  readonly projects = signal<Project[]>([]);

  readonly loading = signal(true);

  readonly saving = signal(false);

  readonly showCreateForm = signal(false);

  readonly errorMessage = signal('');

  readonly formError = signal('');

  readonly workspaceId = signal('');

  // =========================================
  // Form
  // =========================================

  projectName = '';

  projectDescription = '';

  // =========================================
  // Init
  // =========================================

  ngOnInit(): void {
    const workspaceId = this.route.snapshot.queryParamMap.get('workspace');

    if (!workspaceId) {
      this.loading.set(false);

      this.errorMessage.set('Workspace is required.');

      return;
    }

    this.workspaceId.set(workspaceId);

    this.loadProjects(workspaceId);
  }

  // =========================================
  // Load Projects
  // =========================================

  private loadProjects(workspaceId: string): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.projectService.getProjects(workspaceId).subscribe({
      next: (response) => {
        this.projects.set(response.data.projects);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Load projects failed:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load projects.',
        );
      },
    });
  }

  // =========================================
  // Create Project
  // =========================================

  openCreateForm(): void {
    this.projectName = '';

    this.projectDescription = '';

    this.formError.set('');

    this.errorMessage.set('');

    this.showCreateForm.set(true);
  }

  closeCreateForm(): void {
    if (this.saving()) {
      return;
    }

    this.showCreateForm.set(false);

    this.formError.set('');
  }

  createProject(): void {
    const name = this.projectName.trim();

    const description = this.projectDescription.trim();

    const workspaceId = this.workspaceId();

    if (!name) {
      this.formError.set('Project name is required.');

      return;
    }

    if (!workspaceId) {
      this.formError.set('Workspace is required.');

      return;
    }

    this.saving.set(true);

    this.formError.set('');

    this.projectService
      .createProject({
        workspace: workspaceId,
        name,

        ...(description
          ? {
              description,
            }
          : {}),
      })
      .subscribe({
        next: (response) => {
          console.log('Project created:', response);

          this.saving.set(false);

          this.showCreateForm.set(false);

          this.loadProjects(workspaceId);
        },

        error: (error) => {
          console.error('Create project failed:', error);

          this.saving.set(false);

          this.formError.set(
            error?.error?.message ?? 'Unable to create project.',
          );
        },
      });
  }

  // =========================================
  // Open Project → Tasks
  // =========================================

  openProject(projectId: string): void {
    const workspaceId = this.workspaceId();

    if (!workspaceId) {
      this.errorMessage.set('Workspace is required.');

      return;
    }

    this.router.navigate(['/tasks'], {
      queryParams: {
        project: projectId,
        workspace: workspaceId,
      },
    });
  }
}
