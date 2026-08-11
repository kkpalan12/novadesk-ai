import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { MembershipService } from '../../../core/services/membership.service';

import {
  Task,
  TaskPriority,
  TaskStatus,
} from '../../../core/models/task.model';

import { Membership } from '../../../core/models/membership.model';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss',
})
export class TaskComponent implements OnInit {
  // =========================================
  // Dependencies
  // =========================================

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly taskService = inject(TaskService);

  private readonly projectService = inject(ProjectService);

  private readonly membershipService = inject(MembershipService);

  // =========================================
  // State
  // =========================================

  readonly tasks = signal<Task[]>([]);

  readonly members = signal<Membership[]>([]);

  readonly loading = signal(true);

  readonly saving = signal(false);

  readonly assigning = signal<string | null>(null);

  readonly showCreateForm = signal(false);

  readonly errorMessage = signal('');

  readonly formError = signal('');

  readonly projectId = signal('');

  readonly workspaceId = signal('');

  // =========================================
  // Create Task Form
  // =========================================

  taskTitle = '';

  taskDescription = '';

  taskPriority: TaskPriority = 'MEDIUM';

  taskStatus: TaskStatus = 'TODO';

  readonly priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  readonly statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  // =========================================
  // Lifecycle
  // =========================================

  ngOnInit(): void {
    const projectId = this.route.snapshot.queryParamMap.get('project');

    const workspaceId = this.route.snapshot.queryParamMap.get('workspace');

    if (!projectId) {
      this.loading.set(false);

      this.errorMessage.set('Project is required.');

      return;
    }

    this.projectId.set(projectId);

    this.workspaceId.set(workspaceId ?? '');

    this.loadTasks(projectId);

    this.loadMembers(projectId);
  }

  // =========================================
  // Load Tasks
  // =========================================

  private loadTasks(projectId: string): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.taskService.getTasks(projectId).subscribe({
      next: (response) => {
        this.tasks.set(response.data?.tasks ?? []);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Load tasks error:', error);

        this.loading.set(false);

        this.errorMessage.set(error?.error?.message ?? 'Unable to load tasks.');
      },
    });
  }

  // =========================================
  // Load Workspace Members
  // =========================================

  private loadMembers(projectId: string): void {
    this.projectService.getProject(projectId).subscribe({
      next: (response) => {
        const workspace = response.data.workspace;

        const workspaceId =
          typeof workspace === 'string' ? workspace : workspace._id;

        this.membershipService.getWorkspaceMembers(workspaceId).subscribe({
          next: (membersResponse) => {
            this.members.set(membersResponse.data ?? []);
          },

          error: (error) => {
            console.error('Load members error:', error);
          },
        });
      },

      error: (error) => {
        console.error('Load project error:', error);
      },
    });
  }

  // =========================================
  // Open Task Details
  // =========================================

  openTask(taskId: string): void {
    const projectId = this.projectId();

    const workspaceId = this.workspaceId();

    if (!projectId) {
      return;
    }

    this.router.navigate(['/tasks', taskId], {
      queryParams: {
        project: projectId,

        ...(workspaceId
          ? {
              workspace: workspaceId,
            }
          : {}),
      },
    });
  }

  // =========================================
  // Create Form
  // =========================================

  openCreateForm(): void {
    this.taskTitle = '';

    this.taskDescription = '';

    this.taskPriority = 'MEDIUM';

    this.taskStatus = 'TODO';

    this.formError.set('');

    this.showCreateForm.set(true);
  }

  closeCreateForm(): void {
    if (this.saving()) {
      return;
    }

    this.showCreateForm.set(false);

    this.formError.set('');
  }

  // =========================================
  // Create Task
  // =========================================

  createTask(): void {
    const title = this.taskTitle.trim();

    const description = this.taskDescription.trim();

    const projectId = this.projectId();

    if (!title) {
      this.formError.set('Task title is required.');

      return;
    }

    if (!projectId) {
      this.formError.set('Project is required.');

      return;
    }

    this.saving.set(true);

    this.formError.set('');

    this.taskService
      .createTask(projectId, {
        title,

        description: description || undefined,

        priority: this.taskPriority,

        status: this.taskStatus,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.showCreateForm.set(false);

          this.taskTitle = '';

          this.taskDescription = '';

          this.loadTasks(projectId);
        },

        error: (error) => {
          console.error('Create task error:', error);

          this.saving.set(false);

          this.formError.set(error?.error?.message ?? 'Unable to create task.');
        },
      });
  }

  // =========================================
  // Update Task Status
  // =========================================

  updateTaskStatus(task: Task, status: TaskStatus): void {
    const projectId = this.projectId();

    if (!projectId || task.status === status) {
      return;
    }

    const previousStatus = task.status;

    // Optimistic UI update

    this.tasks.update((tasks) =>
      tasks.map((item) =>
        item._id === task._id
          ? {
              ...item,
              status,
            }
          : item,
      ),
    );

    this.taskService
      .updateTask(projectId, task._id, {
        status,
      })
      .subscribe({
        next: () => {
          this.loadTasks(projectId);
        },

        error: (error) => {
          // Rollback

          this.tasks.update((tasks) =>
            tasks.map((item) =>
              item._id === task._id
                ? {
                    ...item,
                    status: previousStatus,
                  }
                : item,
            ),
          );

          this.errorMessage.set(
            error?.error?.message ?? 'Unable to update task status.',
          );
        },
      });
  }

  // =========================================
  // Assignment
  // =========================================

  getAssignedUserId(task: Task): string {
    if (!task.assignedTo) {
      return '';
    }

    if (typeof task.assignedTo === 'string') {
      return task.assignedTo;
    }

    return task.assignedTo._id;
  }

  assignTask(task: Task, userId: string): void {
    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    this.assigning.set(task._id);

    this.errorMessage.set('');

    this.taskService.assignTask(projectId, task._id, userId || '').subscribe({
      next: () => {
        this.assigning.set(null);

        this.loadTasks(projectId);
      },

      error: (error) => {
        console.error('Assign task error:', error);

        this.assigning.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to assign task.',
        );
      },
    });
  }
}
