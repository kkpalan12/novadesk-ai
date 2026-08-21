import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import { TaskService } from '../../../core/services/task.service';

import { SocketService } from '../../../core/services/socket.service';

import { Task, TaskStatus, TaskUser } from '../../../core/models/task.model';

import { TaskCardComponent } from '../task-card/task-card.component';

interface TaskColumn {
  title: string;

  status: TaskStatus;

  tasks: Task[];

  limit?: number;
}

@Component({
  selector: 'app-task-board',

  standalone: true,

  imports: [CommonModule, DragDropModule, TaskCardComponent],

  templateUrl: './task-board.component.html',

  styleUrl: './task-board.component.scss',
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly taskService = inject(TaskService);

  private readonly socketService = inject(SocketService);

  readonly projectId = signal('');

  readonly workspaceId = signal('');

  readonly tasks = signal<Task[]>([]);

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  readonly dragging = signal(false);

  readonly searchText = signal('');

  readonly priorityFilter = signal('');

  readonly assigneeFilter = signal('');
  readonly wipWarning = signal('');

  readonly assignees = computed(() => {
    const users = this.tasks()

      .map((task) => task.assignedTo)

      .filter((user) => user && typeof user !== 'string');

    return users as TaskUser[];
  });

  readonly columns = computed<TaskColumn[]>(() => {
    let items = this.tasks();

    const search = this.searchText().toLowerCase();

    if (search) {
      items = items.filter((task) => task.title.toLowerCase().includes(search));
    }

    if (this.priorityFilter()) {
      items = items.filter((task) => task.priority === this.priorityFilter());
    }

    if (this.assigneeFilter()) {
      items = items.filter(
        (task) =>
          typeof task.assignedTo !== 'string' &&
          task.assignedTo?._id === this.assigneeFilter(),
      );
    }

    return [
      {
        title: 'To Do',

        status: 'TODO',

        tasks: items.filter((task) => task.status === 'TODO'),
      },

      {
        title: 'In Progress',

        status: 'IN_PROGRESS',

        limit: 5,

        tasks: items.filter((task) => task.status === 'IN_PROGRESS'),
      },

      {
        title: 'Review',

        status: 'REVIEW',

        tasks: items.filter((task) => task.status === 'REVIEW'),
      },

      {
        title: 'Done',

        status: 'DONE',

        tasks: items.filter((task) => task.status === 'DONE'),
      },
    ];
  });

  ngOnInit(): void {
    const projectId = this.route.snapshot.queryParamMap.get('project');

    const workspaceId = this.route.snapshot.queryParamMap.get('workspace');

    if (!projectId || !workspaceId) {
      this.errorMessage.set('Project and workspace are required.');

      this.loading.set(false);

      return;
    }

    this.projectId.set(projectId);

    this.workspaceId.set(workspaceId);

    this.socketService.connect();

    this.socketService.joinProject(projectId);

    this.registerSocketListeners();

    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks(this.projectId(), 1, 100).subscribe({
      next: (response) => {
        this.tasks.set(response?.data?.tasks ?? []);

        this.loading.set(false);
      },

      error: (error) => {
        this.errorMessage.set(error?.error?.message ?? 'Unable to load tasks.');

        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  onPriorityChange(event: Event): void {
    this.priorityFilter.set((event.target as HTMLSelectElement).value);
  }

  onAssigneeChange(event: Event): void {
    this.assigneeFilter.set((event.target as HTMLSelectElement).value);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (event.key === '/') {
      event.preventDefault();

      document.querySelector<HTMLInputElement>('.board-toolbar input')?.focus();
    }

    if (event.key === 'Escape') {
      this.searchText.set('');
    }
  }

  startDragging(): void {
    this.dragging.set(true);
  }

  stopDragging(): void {
    setTimeout(() => {
      this.dragging.set(false);
    }, 100);
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,

        event.previousIndex,

        event.currentIndex,
      );

      return;
    }

    const task = event.previousContainer.data[event.previousIndex];

    const column = this.columns().find((c) => c.tasks === event.container.data);
    if (column?.limit && column.tasks.length >= column.limit) {
      this.wipWarning.set(`${column.title} limit reached (${column.limit})`);

      setTimeout(() => {
        this.wipWarning.set('');
      }, 3000);

      return;
    }

    if (!column) {
      return;
    }

    const previousStatus = task.status;

    this.tasks.update((items) =>
      items.map((item) =>
        item._id === task._id
          ? {
              ...item,

              status: column.status,
            }
          : item,
      ),
    );

    this.taskService
      .updateTaskStatus(
        this.projectId(),

        task._id,

        column.status,
      )
      .subscribe({
        error: () => {
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
        },
      });
  }

  openTask(task: Task): void {
    if (this.dragging()) {
      return;
    }

    this.router.navigate(
      ['/tasks', task._id],

      {
        queryParams: {
          project: this.projectId(),

          workspace: this.workspaceId(),
        },
      },
    );
  }

  private registerSocketListeners(): void {
    this.socketService.onTaskStatusChanged((task) => this.updateTask(task));

    this.socketService.onTaskUpdated((task) => this.updateTask(task));

    this.socketService.onTaskDeleted((data) => {
      this.tasks.update((tasks) =>
        tasks.filter((task) => task._id !== data.taskId),
      );
    });
  }

  private updateTask(updatedTask: Task): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)),
    );
  }
  goBackToTasks(): void {
    const projectId = this.projectId();
    const workspaceId = this.workspaceId();

    if (!projectId) {
      this.router.navigate(['/tasks']);
      return;
    }

    this.router.navigate(['/tasks'], {
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
  ngOnDestroy(): void {
    this.socketService.removeTaskListeners();
  }
}
