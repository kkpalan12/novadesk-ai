import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { TaskService } from '../../core/services/task.service';
import { MembershipService } from '../../core/services/membership.service';

import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';

import { Membership } from '../../core/models/membership.model';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss',
})
export class TaskComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly taskService = inject(TaskService);

  private readonly membershipService = inject(MembershipService);

  // =========================================
  // PROJECT / WORKSPACE
  // =========================================

  readonly projectId = signal('');

  readonly workspaceId = signal('');

  // =========================================
  // TASK STATE
  // =========================================

  readonly tasks = signal<Task[]>([]);

  readonly members = signal<Membership[]>([]);

  readonly loading = signal(true);

  readonly saving = signal(false);

  readonly deleting = signal<string | null>(null);

  readonly errorMessage = signal('');

  readonly formError = signal('');

  readonly showCreateForm = signal(false);

  readonly editingTask = signal<Task | null>(null);

  // =========================================
  // PAGINATION
  // =========================================

  readonly page = signal(1);

  readonly limit = signal(10);

  readonly total = signal(0);

  readonly totalPages = signal(1);

  // =========================================
  // FILTERS
  // =========================================

  search = '';

  selectedStatus: TaskStatus | '' = '';

  selectedPriority: TaskPriority | '' = '';

  // =========================================
  // CREATE / EDIT FORM
  // =========================================

  taskTitle = '';

  taskDescription = '';

  taskPriority: TaskPriority = 'MEDIUM';

  taskStatus: TaskStatus = 'TODO';

  taskDueDate = '';

  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {
    const projectId = this.route.snapshot.queryParamMap.get('project');

    const workspaceId = this.route.snapshot.queryParamMap.get('workspace');

    console.log('Task page project:', projectId);

    console.log('Task page workspace:', workspaceId);

    if (!projectId) {
      this.loading.set(false);

      this.errorMessage.set('Project is required.');

      return;
    }

    if (!workspaceId) {
      this.loading.set(false);

      this.errorMessage.set('Workspace is required.');

      return;
    }

    this.projectId.set(projectId);

    this.workspaceId.set(workspaceId);

    this.loadTasks();

    this.loadMembers(workspaceId);
  }

  // =========================================
  // LOAD TASKS
  // =========================================

  loadTasks(): void {
    const projectId = this.projectId();

    if (!projectId) {
      this.errorMessage.set('Project is required.');

      return;
    }

    this.loading.set(true);

    this.errorMessage.set('');

    this.taskService.getTasks(projectId, this.page(), this.limit()).subscribe({
      next: (response) => {
        console.log('Tasks response:', response);

        const data = response?.data;

        this.tasks.set(data?.tasks ?? []);

        this.total.set(data?.total ?? 0);

        this.totalPages.set(data?.totalPages ?? 1);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Load tasks failed:', error);

        this.loading.set(false);

        this.errorMessage.set(error?.error?.message ?? 'Unable to load tasks.');
      },
    });
  }

  // =========================================
  // LOAD MEMBERS
  // =========================================

  private loadMembers(workspaceId: string): void {
    this.membershipService.getWorkspaceMembers(workspaceId).subscribe({
      next: (response) => {
        this.members.set(response?.data ?? []);
      },

      error: (error) => {
        console.error('Load members failed:', error);

        this.members.set([]);
      },
    });
  }

  // =========================================
  // CREATE FORM
  // =========================================

  openCreateForm(): void {
    this.editingTask.set(null);

    this.taskTitle = '';

    this.taskDescription = '';

    this.taskPriority = 'MEDIUM';

    this.taskStatus = 'TODO';

    this.taskDueDate = '';

    this.formError.set('');

    this.showCreateForm.set(true);
  }

  // =========================================
  // EDIT FORM
  // =========================================

  openEditForm(task: Task): void {
    this.editingTask.set(task);

    this.taskTitle = task.title;

    this.taskDescription = task.description ?? '';

    this.taskPriority = task.priority;

    this.taskStatus = task.status;

    this.taskDueDate = this.formatDateForInput(task.dueDate);

    this.formError.set('');

    this.showCreateForm.set(true);
  }

  // =========================================
  // CLOSE FORM
  // =========================================

  closeCreateForm(): void {
    if (this.saving()) {
      return;
    }

    this.showCreateForm.set(false);

    this.editingTask.set(null);

    this.formError.set('');

    this.resetForm();
  }

  // =========================================
  // RESET FORM
  // =========================================

  private resetForm(): void {
    this.taskTitle = '';

    this.taskDescription = '';

    this.taskPriority = 'MEDIUM';

    this.taskStatus = 'TODO';

    this.taskDueDate = '';
  }

  // =========================================
  // SAVE TASK
  // CREATE OR UPDATE
  // =========================================

  saveTask(): void {
    const projectId = this.projectId();

    const title = this.taskTitle.trim();

    const description = this.taskDescription.trim();

    if (!projectId) {
      this.formError.set('Project is required.');

      return;
    }

    if (!title) {
      this.formError.set('Task title is required.');

      return;
    }

    this.saving.set(true);

    this.formError.set('');

    const editingTask = this.editingTask();

    // =====================================
    // UPDATE
    // =====================================

    if (editingTask) {
      this.taskService
        .updateTask(projectId, editingTask._id, {
          title,

          description: description || undefined,

          status: this.taskStatus,

          priority: this.taskPriority,

          dueDate: this.taskDueDate || undefined,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);

            this.showCreateForm.set(false);

            this.editingTask.set(null);

            this.resetForm();

            this.loadTasks();
          },

          error: (error) => {
            console.error('Update task failed:', error);

            this.saving.set(false);

            this.formError.set(
              error?.error?.message ?? 'Unable to update task.',
            );
          },
        });

      return;
    }

    // =====================================
    // CREATE
    // =====================================

    this.taskService
      .createTask(projectId, {
        title,

        description: description || undefined,

        priority: this.taskPriority,

        dueDate: this.taskDueDate || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.showCreateForm.set(false);

          this.resetForm();

          this.loadTasks();
        },

        error: (error) => {
          console.error('Create task failed:', error);

          this.saving.set(false);

          this.formError.set(error?.error?.message ?? 'Unable to create task.');
        },
      });
  }

  // =========================================
  // CHANGE STATUS
  // =========================================

  changeStatus(task: Task, status: string): void {
    if (!this.isTaskStatus(status)) {
      return;
    }

    if (task.status === status) {
      return;
    }

    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    const previousStatus = task.status;

    // Optimistic UI update

    this.tasks.update((items) =>
      items.map((item) =>
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
          this.loadTasks();
        },

        error: (error) => {
          console.error('Change task status failed:', error);

          // Restore previous state

          this.tasks.update((items) =>
            items.map((item) =>
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
  // DELETE TASK
  // =========================================

  deleteTask(task: Task): void {
    if (this.deleting()) {
      return;
    }

    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    this.deleting.set(task._id);

    this.errorMessage.set('');

    this.taskService.deleteTask(projectId, task._id).subscribe({
      next: () => {
        this.tasks.update((items) =>
          items.filter((item) => item._id !== task._id),
        );

        this.total.update((value) => Math.max(0, value - 1));

        this.deleting.set(null);

        // If current page becomes empty,
        // move back one page.

        if (this.tasks().length === 0 && this.page() > 1) {
          this.page.update((value) => value - 1);

          this.loadTasks();
        }
      },

      error: (error) => {
        console.error('Delete task failed:', error);

        this.deleting.set(null);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to delete task.',
        );
      },
    });
  }

  // =========================================
  // FILTERS
  // =========================================

  applyFilters(): void {
    /*
     * Current backend task repository supports:
     * search
     * status
     * priority
     *
     * The TaskService must pass these query params.
     */

    this.page.set(1);

    this.loadTasksWithFilters();
  }

  clearFilters(): void {
    this.search = '';

    this.selectedStatus = '';

    this.selectedPriority = '';

    this.page.set(1);

    this.loadTasksWithFilters();
  }

  // =========================================
  // LOAD WITH FILTERS
  // =========================================

  private loadTasksWithFilters(): void {
    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    this.loading.set(true);

    this.errorMessage.set('');

    this.taskService
      .getTasks(
        projectId,
        this.page(),
        this.limit(),
        this.search.trim() || undefined,
        this.selectedStatus || undefined,
        this.selectedPriority || undefined,
      )
      .subscribe({
        next: (response) => {
          const data = response?.data;

          this.tasks.set(data?.tasks ?? []);

          this.total.set(data?.total ?? 0);

          this.totalPages.set(data?.totalPages ?? 1);

          this.loading.set(false);
        },

        error: (error) => {
          console.error('Load filtered tasks failed:', error);

          this.loading.set(false);

          this.errorMessage.set(
            error?.error?.message ?? 'Unable to load tasks.',
          );
        },
      });
  }

  // =========================================
  // PAGINATION
  // =========================================

  previousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.page.update((value) => value - 1);

    this.loadTasksWithFilters();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) {
      return;
    }

    this.page.update((value) => value + 1);

    this.loadTasksWithFilters();
  }

  // =========================================
  // BACK TO PROJECTS
  // =========================================

  backToProjects(): void {
    const workspaceId = this.workspaceId();

    if (!workspaceId) {
      this.router.navigate(['/projects']);

      return;
    }

    this.router.navigate(['/projects'], {
      queryParams: {
        workspace: workspaceId,
      },
    });
  }

  // =========================================
  // USER NAME
  // =========================================

  getUserName(
    user:
      | string
      | {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        },
  ): string {
    if (!user) {
      return 'Unassigned';
    }

    if (typeof user === 'string') {
      const member = this.members().find((item) => item.user?._id === user);

      if (member) {
        return `${member.user.firstName} ${member.user.lastName}`;
      }

      return 'Assigned User';
    }

    return `${user.firstName} ${user.lastName}`;
  }

  // =========================================
  // LABELS
  // =========================================

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'TODO':
        return 'To Do';

      case 'IN_PROGRESS':
        return 'In Progress';

      case 'REVIEW':
        return 'Review';

      case 'DONE':
        return 'Done';

      default:
        return status;
    }
  }

  getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
      case 'LOW':
        return 'Low';

      case 'MEDIUM':
        return 'Medium';

      case 'HIGH':
        return 'High';

      case 'CRITICAL':
        return 'Critical';

      default:
        return priority;
    }
  }

  // =========================================
  // HELPERS
  // =========================================

  private isTaskStatus(value: string): value is TaskStatus {
    return ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].includes(value);
  }

  private formatDateForInput(date?: string | Date): string {
    if (!date) {
      return '';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const year = parsed.getFullYear();

    const month = String(parsed.getMonth() + 1).padStart(2, '0');

    const day = String(parsed.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  openTaskDetail(task: Task): void {
    const projectId = this.projectId();
    const workspaceId = this.workspaceId();

    if (!projectId || !workspaceId || !task._id) {
      return;
    }

    this.router.navigate(['/tasks', task._id], {
      queryParams: {
        project: projectId,
        workspace: workspaceId,
      },
    });
  }
}
