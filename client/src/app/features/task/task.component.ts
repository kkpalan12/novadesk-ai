import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { TaskService } from '../../core/services/task.service';
import { MembershipService } from '../../core/services/membership.service';
import { SocketService } from '../../core/services/socket.service';

import { Task, TaskPriority, TaskStatus } from '../../core/models/task.model';

import { Membership } from '../../core/models/membership.model';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss',
})
export class TaskComponent implements OnInit, OnDestroy {
  // =========================================
  // SERVICES
  // =========================================

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly taskService = inject(TaskService);

  private readonly membershipService = inject(MembershipService);

  private readonly socketService = inject(SocketService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  // =========================================
  // PROJECT / WORKSPACE
  // =========================================

  readonly projectId = signal('');

  readonly workspaceId = signal('');
  readonly projectName = signal('');

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

  taskAssignedTo = '';

  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {
    const projectId = this.route.snapshot.queryParamMap.get('project');

    const workspaceId = this.route.snapshot.queryParamMap.get('workspace');

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

    // =========================================
    // SOCKET
    // =========================================

    this.socketService.connect();

    this.socketService.joinProject(projectId);

    // =========================================
    // TASK CREATED
    // =========================================

    this.socketService.onTaskCreated((createdTask) => {
      const createdProjectId =
        typeof createdTask?.project === 'string'
          ? createdTask.project
          : createdTask?.project?._id;

      // Ignore events from another project
      if (createdProjectId && createdProjectId !== projectId) {
        return;
      }

      // Reload using current filters
      this.loadTasksWithFilters();
    });

    // =========================================
    // TASK UPDATED
    // =========================================

    this.socketService.onTaskUpdated((updatedTask) => {
      const updatedProjectId =
        typeof updatedTask?.project === 'string'
          ? updatedTask.project
          : updatedTask?.project?._id;

      // Ignore another project
      if (updatedProjectId && updatedProjectId !== projectId) {
        return;
      }

      this.loadTasksWithFilters();
    });
    // =========================================
    // TASK ASSIGNED
    // =========================================

    this.socketService.onTaskAssigned((assignedTask) => {
      const assignedProjectId =
        typeof assignedTask?.project === 'string'
          ? assignedTask.project
          : assignedTask?.project?._id;

      if (assignedProjectId && assignedProjectId !== projectId) {
        return;
      }

      this.loadTasksWithFilters();
    });
    // =========================================
    // TASK STATUS CHANGED
    // =========================================

    this.socketService.onTaskStatusChanged((updatedTask) => {
      const updatedProjectId =
        typeof updatedTask?.project === 'string'
          ? updatedTask.project
          : updatedTask?.project?._id;

      if (updatedProjectId && updatedProjectId !== projectId) {
        return;
      }

      this.loadTasksWithFilters();
    });
    // =========================================
    // TASK DELETED
    // =========================================

    this.socketService.onTaskDeleted((data) => {
      if (!data?.taskId) {
        return;
      }

      const taskExists = this.tasks().some((task) => task._id === data.taskId);

      if (!taskExists) {
        return;
      }

      this.tasks.update((items) =>
        items.filter((task) => task._id !== data.taskId),
      );

      this.total.update((value) => Math.max(0, value - 1));
    });

    // =========================================
    // INITIAL DATA
    // =========================================

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
        const data = response?.data;

        const tasks = data?.tasks ?? [];

        this.tasks.set(tasks);

        this.setProjectName(tasks);
        this.total.set(data?.total ?? 0);

        this.totalPages.set(data?.totalPages ?? 1);

        this.loading.set(false);
      },

      error: (error) => {
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
    this.taskAssignedTo = '';

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

    if (typeof task.assignedTo === 'string') {
      this.taskAssignedTo = task.assignedTo;
    } else {
      this.taskAssignedTo = task.assignedTo?._id ?? '';
    }

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
    this.taskAssignedTo = '';
  }

  // =========================================
  // SAVE TASK
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
            this.assignTaskAfterSave(projectId, editingTask._id, () => {
              this.saving.set(false);

              this.showCreateForm.set(false);

              this.editingTask.set(null);

              this.resetForm();

              this.loadTasks();
            });
          },

          error: (error) => {
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
        next: (response) => {
          const createdTaskId = response?.data?._id;

          if (createdTaskId && this.taskAssignedTo) {
            this.assignTaskAfterSave(projectId, createdTaskId, () => {
              this.saving.set(false);

              this.showCreateForm.set(false);

              this.resetForm();

              this.loadTasks();
            });

            return;
          }

          this.saving.set(false);

          this.showCreateForm.set(false);

          this.resetForm();

          this.loadTasks();
        },

        error: (error) => {
          this.saving.set(false);

          this.formError.set(error?.error?.message ?? 'Unable to create task.');
        },
      });
  }

  // =========================================
  // ASSIGN TASK
  // =========================================

  private assignTaskAfterSave(
    projectId: string,
    taskId: string,
    onSuccess: () => void,
  ): void {
    if (!this.taskAssignedTo) {
      onSuccess();
      return;
    }

    this.taskService
      .assignTask(projectId, taskId, this.taskAssignedTo)
      .subscribe({
        next: () => {
          onSuccess();
        },

        error: (error) => {
          this.saving.set(false);

          this.formError.set(
            error?.error?.message ?? 'Task saved but assignment failed.',
          );

          this.loadTasks();
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

    this.taskService.updateTaskStatus(projectId, task._id, status).subscribe({
      next: () => {
        this.loadTasks();
      },

      error: (error) => {
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

  async deleteTask(task: Task): Promise<void> {
    if (this.deleting()) {
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete task?',
      message: `Are you sure you want to delete "${task.title}" ? This action cannot be undone.`,
      confirmText: 'Delete task',
      cancelText: 'Keep task',
      variant: 'danger',
    });

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

        if (this.tasks().length === 0 && this.page() > 1) {
          this.page.update((value) => value - 1);

          this.loadTasks();
        }
      },

      error: (error) => {
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

          const tasks = data?.tasks ?? [];

          this.tasks.set(tasks);

          this.setProjectName(tasks);
          this.total.set(data?.total ?? 0);

          this.totalPages.set(data?.totalPages ?? 1);

          this.loading.set(false);
        },

        error: (error) => {
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

  // =========================================
  // TASK DETAIL
  // =========================================

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
  private setProjectName(tasks: Task[]): void {
    const firstTask = tasks[0];

    if (firstTask?.project && typeof firstTask.project !== 'string') {
      this.projectName.set(firstTask.project.name ?? '');
    }
  }
  // =========================================
  // SOCKET CLEANUP
  // =========================================

  // =========================================
  // DESTROY
  // =========================================

  ngOnDestroy(): void {
    const projectId = this.projectId();

    if (projectId) {
      this.socketService.leaveProject(projectId);
    }

    this.socketService.removeTaskListeners();
  }
}
