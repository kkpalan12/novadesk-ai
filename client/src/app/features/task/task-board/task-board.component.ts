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

import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

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

  imports: [
    CommonModule,
    DragDropModule,
    TaskCardComponent,
    RouterLink,
    RouterLinkActive,
  ],

  templateUrl: './task-board.component.html',

  styleUrl: './task-board.component.scss',
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  // =========================================
  // SERVICES
  // =========================================

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly taskService = inject(TaskService);

  private readonly socketService = inject(SocketService);

  // =========================================
  // STATE
  // =========================================

  readonly projectId = signal('');

  readonly workspaceId = signal('');

  readonly projectName = signal('');

  readonly tasks = signal<Task[]>([]);

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  readonly dragging = signal(false);

  readonly searchText = signal('');

  readonly priorityFilter = signal('');

  readonly assigneeFilter = signal('');

  readonly wipWarning = signal('');

  // =========================================
  // ASSIGNEES
  // =========================================

  readonly assignees = computed(() => {
    const users = this.tasks()

      .map((task) => task.assignedTo)

      .filter((user): user is TaskUser => !!user && typeof user !== 'string');

    return Array.from(new Map(users.map((user) => [user._id, user])).values());
  });

  // =========================================
  // COLUMNS
  // =========================================

  readonly columns = computed<TaskColumn[]>(() => {
    let items = this.tasks();

    const search = this.searchText().trim().toLowerCase();

    if (search) {
      items = items.filter((task) => task.title.toLowerCase().includes(search));
    }

    const priority = this.priorityFilter();

    if (priority) {
      items = items.filter((task) => task.priority === priority);
    }

    const assignee = this.assigneeFilter();

    if (assignee) {
      items = items.filter(
        (task) =>
          typeof task.assignedTo !== 'string' &&
          task.assignedTo?._id === assignee,
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
  // =========================================
  // INIT
  // =========================================

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

    // ---------------------------------------
    // SOCKET
    // ---------------------------------------

    this.socketService.connect();

    this.socketService.joinProject(projectId);

    this.registerSocketListeners();

    // ---------------------------------------
    // LOAD
    // ---------------------------------------

    this.loadTasks();
  }

  // =========================================
  // LOAD TASKS
  // =========================================

  loadTasks(): void {
    this.loading.set(true);

    this.errorMessage.set('');

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

  // =========================================
  // FILTERS
  // =========================================

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchText.set(value);
  }

  onPriorityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.priorityFilter.set(value);
  }

  onAssigneeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.assigneeFilter.set(value);
  }

  // =========================================
  // KEYBOARD SEARCH
  // =========================================

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (event.key === '/' && !this.isTypingTarget(event.target)) {
      event.preventDefault();

      document.querySelector<HTMLInputElement>('.board-toolbar input')?.focus();
    }

    if (event.key === 'Escape') {
      this.searchText.set('');
    }
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;

    if (!element) {
      return false;
    }

    return (
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      element.isContentEditable
    );
  }

  // =========================================
  // DRAG EVENTS
  // =========================================

  startDragging(): void {
    this.dragging.set(true);
  }

  stopDragging(): void {
    setTimeout(() => {
      this.dragging.set(false);
    }, 100);
  }

  // =========================================
  // DROP
  // =========================================

  drop(event: CdkDragDrop<Task[]>): void {
    const task = event.previousContainer.data[event.previousIndex];

    if (!task) {
      return;
    }

    // SAME COLUMN

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,

        event.previousIndex,

        event.currentIndex,
      );

      return;
    }

    const targetElement = event.container.element.nativeElement as HTMLElement;

    const targetStatus = targetElement.getAttribute(
      'data-status',
    ) as TaskStatus | null;

    if (!targetStatus) {
      return;
    }

    if (task.status === targetStatus) {
      return;
    }

    const targetColumn = this.columns().find(
      (column) => column.status === targetStatus,
    );

    if (!targetColumn) {
      return;
    }

    // WIP LIMIT

    if (targetColumn.limit) {
      const count = this.tasks().filter(
        (item) => item.status === targetStatus,
      ).length;

      if (count >= targetColumn.limit) {
        this.showWipWarning(`${targetColumn.title} limit reached`);

        return;
      }
    }

    const previousStatus = task.status;

    // OPTIMISTIC UPDATE

    this.tasks.update((items) =>
      items.map((item) =>
        item._id === task._id
          ? {
              ...item,
              status: targetStatus,
            }
          : item,
      ),
    );

    // API UPDATE

    this.taskService

      .updateTaskStatus(
        this.projectId(),

        task._id,

        targetStatus,
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

          this.showWipWarning('Unable to update task status.');
        },
      });
  }
  // =========================================
  // OPEN TASK
  // =========================================

  openTask(task: Task): void {
    if (this.dragging()) {
      return;
    }

    this.router.navigate(['/tasks', task._id], {
      queryParams: {
        project: this.projectId(),

        workspace: this.workspaceId(),
      },
    });
  }

  // =========================================
  // SOCKET LISTENERS
  // =========================================

  private registerSocketListeners(): void {
    this.socketService.onTaskStatusChanged((task) => {
      this.updateTask(task);
    });

    this.socketService.onTaskUpdated((task) => {
      this.updateTask(task);
    });

    this.socketService.onTaskDeleted((data) => {
      this.tasks.update((tasks) =>
        tasks.filter((task) => task._id !== data.taskId),
      );
    });
  }

  // =========================================
  // SOCKET UPDATE
  // =========================================

  private updateTask(updatedTask: Task): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task)),
    );
  }

  // =========================================
  // BACK TO LIST
  // =========================================

  goBackToTasks(): void {
    this.router.navigate(['/tasks'], {
      queryParams: {
        project: this.projectId(),

        workspace: this.workspaceId(),
      },
    });
  }

  // =========================================
  // WIP WARNING
  // =========================================

  private showWipWarning(message: string): void {
    this.wipWarning.set(message);

    setTimeout(() => {
      this.wipWarning.set('');
    }, 3000);
  }

  // =========================================
  // DESTROY
  // =========================================

  ngOnDestroy(): void {
    this.socketService.removeTaskListeners();
  }
}
