import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { ProjectService } from '../../core/services/project.service';

import { Project, UpdateProjectRequest } from '../../core/models/project.model';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-project',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './project.component.html',

  styleUrl: './project.component.scss',
})
export class ProjectComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly projectService = inject(ProjectService);
  private readonly socketService = inject(SocketService);

  // =========================================
  // State
  // =========================================

  readonly projects = signal<Project[]>([]);

  readonly loading = signal(true);

  readonly saving = signal(false);

  readonly deleting = signal<string | null>(null);

  readonly showCreateForm = signal(false);

  readonly showEditForm = signal(false);

  readonly errorMessage = signal('');

  readonly formError = signal('');

  readonly workspaceId = signal('');

  readonly editingProject = signal<Project | null>(null);

  // =========================================
  // Create Form
  // =========================================

  projectName = '';

  projectDescription = '';

  // =========================================
  // Edit Form
  // =========================================

  editProjectName = '';

  editProjectDescription = '';

  editProjectStatus: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE';

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

    this.socketService.connect();

    this.socketService.joinWorkspace(workspaceId);
    // =========================================
    // PROJECT CREATED
    // =========================================

    this.socketService.onProjectCreated((project) => {
      console.log('📁 REAL-TIME PROJECT CREATED:', project);

      const projectWorkspaceId =
        typeof project?.workspace === 'string'
          ? project.workspace
          : project?.workspace?._id;

      if (projectWorkspaceId && projectWorkspaceId !== workspaceId) {
        return;
      }

      this.loadProjects(workspaceId);
    });

    // =========================================
    // PROJECT UPDATED
    // =========================================

    this.socketService.onProjectUpdated((project) => {
      console.log('📁 REAL-TIME PROJECT UPDATED:', project);

      const projectWorkspaceId =
        typeof project?.workspace === 'string'
          ? project.workspace
          : project?.workspace?._id;

      if (projectWorkspaceId && projectWorkspaceId !== workspaceId) {
        return;
      }

      this.projects.update((items) =>
        items.map((item) => (item._id === project._id ? project : item)),
      );
    });

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
        this.projects.set(response?.data?.projects ?? []);

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

    this.showEditForm.set(false);

    this.editingProject.set(null);

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
        next: () => {
          this.saving.set(false);

          this.showCreateForm.set(false);

          this.projectName = '';

          this.projectDescription = '';

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
  // OPEN PROJECT → TASKS
  // =========================================

  openProject(projectId: string): void {
    const workspaceId = this.workspaceId();

    if (!projectId) {
      this.errorMessage.set('Project is required.');

      return;
    }

    if (!workspaceId) {
      this.errorMessage.set('Workspace is required.');

      return;
    }

    console.log('Opening project:', projectId);

    console.log('Workspace:', workspaceId);

    this.router.navigate(['/tasks'], {
      queryParams: {
        project: projectId,
        workspace: workspaceId,
      },
    });
  }

  // =========================================
  // Edit Project
  // =========================================

  openEditForm(project: Project): void {
    this.showCreateForm.set(false);

    this.editingProject.set(project);

    this.editProjectName = project.name;

    this.editProjectDescription = project.description ?? '';

    this.editProjectStatus = project.status;

    this.formError.set('');

    this.showEditForm.set(true);
  }

  closeEditForm(): void {
    if (this.saving()) {
      return;
    }

    this.showEditForm.set(false);

    this.editingProject.set(null);

    this.formError.set('');
  }

  updateProject(): void {
    const project = this.editingProject();

    if (!project) {
      return;
    }

    const name = this.editProjectName.trim();

    const description = this.editProjectDescription.trim();

    if (!name) {
      this.formError.set('Project name is required.');

      return;
    }

    const data: UpdateProjectRequest = {
      name,
      description,
      status: this.editProjectStatus,
    };

    this.saving.set(true);

    this.formError.set('');

    this.projectService.updateProject(project._id, data).subscribe({
      next: (response) => {
        this.saving.set(false);

        this.showEditForm.set(false);

        this.editingProject.set(null);

        this.projects.update((items) =>
          items.map((item) =>
            item._id === response.data._id ? response.data : item,
          ),
        );
      },

      error: (error) => {
        console.error('Update project failed:', error);

        this.saving.set(false);

        this.formError.set(
          error?.error?.message ?? 'Unable to update project.',
        );
      },
    });
  }

  // =========================================
  // Delete Project
  // =========================================

  deleteProject(project: Project): void {
    if (this.deleting()) {
      return;
    }

    const confirmed = window.confirm(`Delete "${project.name}"?`);

    if (!confirmed) {
      return;
    }

    this.deleting.set(project._id);

    this.errorMessage.set('');

    this.projectService.deleteProject(project._id).subscribe({
      next: () => {
        this.projects.update((items) =>
          items.filter((item) => item._id !== project._id),
        );

        this.deleting.set(null);
      },

      error: (error) => {
        console.error('Delete project failed:', error);

        this.deleting.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to delete project.',
        );
      },
    });
  }
  ngOnDestroy(): void {
    const workspaceId = this.workspaceId();

    if (workspaceId) {
      this.socketService.leaveWorkspace(workspaceId);
    }

    this.socketService.removeProjectListeners();

    console.log('🧹 Project component destroyed');
  }
}
