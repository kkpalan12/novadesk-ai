import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TaskService } from '../../core/services/task.service';
import { CommentService } from '../../core/services/comment.service';
import { TaskHistoryService } from '../../core/services/task-history.service';
import { ActivityService } from '../../core/services/activity.service';
import { AttachmentService } from '../../core/services/attachment.service';
import { SocketService } from '../../core/services/socket.service';

import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';
import { Comment } from '../../core/models/comment.model';
import { TaskHistory } from '../../core/models/task-history.model';
import { Activity } from '../../core/models/activity.model';
import { Attachment } from '../../core/models/attachment.model';
import { TaskAiService } from '../../core/services/task-ai.service';

import { TaskAiAnalysis } from '../../core/models/task-ai.model';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  // =========================================================
  // Dependencies
  // =========================================================

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly taskService = inject(TaskService);

  private readonly commentService = inject(CommentService);

  private readonly taskHistoryService = inject(TaskHistoryService);

  private readonly activityService = inject(ActivityService);

  private readonly attachmentService = inject(AttachmentService);

  private readonly socketService = inject(SocketService);
  private readonly taskAiService = inject(TaskAiService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  // =========================================================
  // Task
  // =========================================================

  readonly task = signal<Task | null>(null);

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  readonly projectId = signal('');

  readonly workspaceId = signal('');

  // =========================================================
  // Comments
  // =========================================================

  readonly comments = signal<Comment[]>([]);

  readonly commentsLoading = signal(false);

  readonly commentSaving = signal(false);

  readonly commentDeleting = signal<string | null>(null);

  readonly editingCommentId = signal<string | null>(null);

  readonly commentError = signal('');
  readonly aiAnalysis = signal<TaskAiAnalysis | null>(null);

  readonly aiLoading = signal(false);

  readonly aiError = signal('');

  commentText = '';

  editingCommentText = '';

  // =========================================================
  // History
  // =========================================================

  readonly history = signal<TaskHistory[]>([]);

  readonly historyLoading = signal(false);

  readonly historyError = signal('');

  // =========================================================
  // Activity
  // =========================================================

  readonly activities = signal<Activity[]>([]);

  readonly activityLoading = signal(false);

  readonly activityError = signal('');
  readonly activityLoadingMore = signal(false);

  readonly activityPage = signal(1);

  readonly activityTotalPages = signal(1);

  // =========================================================
  // Attachments
  // =========================================================

  readonly attachments = signal<Attachment[]>([]);

  readonly attachmentsLoading = signal(false);

  readonly attachmentUploading = signal(false);

  readonly attachmentDeleting = signal<string | null>(null);

  readonly attachmentError = signal('');

  readonly activityTotal = signal(0);

  readonly selectedFile = signal<File | null>(null);
  readonly showStatusMenu = signal(false);

  readonly updatingStatus = signal(false);
  // =========================================================
  // Edit Task
  // =========================================================

  readonly editMode = signal(false);

  readonly savingTask = signal(false);

  readonly editError = signal('');

  editTitle = '';

  editDescription = '';

  editPriority: TaskPriority = 'MEDIUM';

  editDueDate = '';

  editAssignedTo = '';

  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id');

    const projectId = this.route.snapshot.queryParamMap.get('project');

    const workspaceId = this.route.snapshot.queryParamMap.get('workspace');

    if (!taskId || !projectId) {
      this.loading.set(false);

      this.errorMessage.set('Task and project are required.');

      return;
    }

    this.projectId.set(projectId);

    this.workspaceId.set(workspaceId ?? '');

    // Initialize realtime
    this.initializeRealtime(projectId, taskId);

    // Load task
    this.loadTask(projectId, taskId);
  }

  ngOnDestroy(): void {
    const projectId = this.projectId();

    if (projectId) {
      this.socketService.leaveProject(projectId);
    }

    this.socketService.removeCommentListeners();

    this.socketService.removeActivityListeners();
  }

  // =========================================================
  // REALTIME
  // =========================================================

  private initializeRealtime(projectId: string, taskId: string): void {
    this.socketService.connect();

    this.socketService.joinProject(projectId);
    // =======================================================
    // Activity Created
    // =======================================================

    this.socketService.onActivityCreated((activity: Activity) => {
      if (!activity?._id) {
        return;
      }

      let added = false;

      this.activities.update((items) => {
        const exists = items.some((item) => item._id === activity._id);

        if (exists) {
          return items;
        }

        added = true;

        return [activity, ...items];
      });

      if (!added) {
        return;
      }

      this.activityTotal.update((total) => total + 1);

      this.activityTotalPages.set(Math.ceil(this.activityTotal() / 20));
    });

    // =======================================================
    // Task Updated
    // =======================================================

    this.socketService.onTaskUpdated((updatedTask: Task) => {
      if (!updatedTask?._id) {
        return;
      }

      if (updatedTask._id !== taskId) {
        return;
      }

      this.task.set(updatedTask);

      this.loadHistory(taskId);

      this.loadActivity(projectId);
    });

    // =======================================================
    // Task Deleted
    // =======================================================

    this.socketService.onTaskDeleted((data: { taskId: string }) => {
      if (data?.taskId !== taskId) {
        return;
      }

      this.router.navigate(['/tasks'], {
        queryParams: {
          project: projectId,

          ...(this.workspaceId()
            ? {
                workspace: this.workspaceId(),
              }
            : {}),
        },
      });
    });

    // =======================================================
    // Comment Created
    // =======================================================

    this.socketService.onCommentCreated((data) => {
      if (!data?.taskId || !data?.comment) {
        return;
      }

      if (data.taskId !== taskId) {
        return;
      }

      this.comments.update((items) => {
        const exists = items.some((item) => item._id === data.comment._id);

        if (exists) {
          return items.map((item) =>
            item._id === data.comment._id ? data.comment : item,
          );
        }

        return [data.comment, ...items];
      });

      this.loadActivity(projectId);
    });

    // =======================================================
    // Comment Updated
    // =======================================================

    this.socketService.onCommentUpdated((data) => {
      if (!data?.taskId || !data?.comment) {
        return;
      }

      if (data.taskId !== taskId) {
        return;
      }

      this.comments.update((items) =>
        items.map((item) =>
          item._id === data.comment._id ? data.comment : item,
        ),
      );

      this.loadActivity(projectId);
    });

    // =======================================================
    // Comment Deleted
    // =======================================================

    this.socketService.onCommentDeleted((data) => {
      if (!data?.taskId || !data?.commentId) {
        return;
      }

      if (data.taskId !== taskId) {
        return;
      }

      this.comments.update((items) =>
        items.filter((item) => item._id !== data.commentId),
      );

      this.loadActivity(projectId);
    });
  }

  // =========================================================
  // Task
  // =========================================================

  private loadTask(projectId: string, taskId: string): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.taskService.getTaskById(projectId, taskId).subscribe({
      next: (response) => {
        this.task.set(response.data);

        this.loading.set(false);

        this.loadComments(taskId);

        this.loadHistory(taskId);

        this.loadActivity(projectId);

        this.loadAttachments(taskId);
      },

      error: (error) => {
        console.error('Load task error:', error);

        this.loading.set(false);

        this.errorMessage.set(error?.error?.message ?? 'Unable to load task.');
      },
    });
  }

  // =========================================================
  // Status Formatting
  // =========================================================

  formatStatus(status: string): string {
    return status
      .replace(/\_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // =========================================================
  // Assignment
  // =========================================================

  getAssignedUserName(): string {
    const currentTask = this.task();

    if (!currentTask?.assignedTo) {
      return 'Unassigned';
    }

    if (typeof currentTask.assignedTo === 'string') {
      return 'Assigned';
    }

    return `${currentTask.assignedTo.firstName} ${currentTask.assignedTo.lastName}`;
  }

  // =========================================================
  // Comments
  // =========================================================

  private loadComments(taskId: string): void {
    this.commentsLoading.set(true);

    this.commentError.set('');

    this.commentService.getComments(taskId).subscribe({
      next: (response) => {
        this.comments.set(response.data ?? []);

        this.commentsLoading.set(false);
      },

      error: (error) => {
        console.error('Load comments error:', error);

        this.commentsLoading.set(false);

        this.commentError.set(
          error?.error?.message ?? 'Unable to load comments.',
        );
      },
    });
  }

  createComment(): void {
    const taskId = this.task()?._id;

    const content = this.commentText.trim();

    if (!taskId || !content) {
      return;
    }

    this.commentSaving.set(true);

    this.commentError.set('');

    this.commentService
      .createComment(taskId, {
        content,
      })
      .subscribe({
        next: () => {
          this.commentText = '';

          this.commentSaving.set(false);

          /*
           * Do not depend on realtime
           * for the creator's own UI.
           *
           * Reloading also keeps the
           * creator immediately in sync.
           */
          this.loadComments(taskId);
        },

        error: (error) => {
          console.error('Create comment error:', error);

          this.commentSaving.set(false);

          this.commentError.set(
            error?.error?.message ?? 'Unable to create comment.',
          );
        },
      });
  }

  startEditComment(comment: Comment): void {
    this.editingCommentId.set(comment._id);

    this.editingCommentText = comment.content;

    this.commentError.set('');
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);

    this.editingCommentText = '';

    this.commentError.set('');
  }

  updateComment(comment: Comment): void {
    const content = this.editingCommentText.trim();

    if (!content) {
      return;
    }

    this.commentSaving.set(true);

    this.commentError.set('');

    this.commentService
      .updateComment(comment._id, {
        content,
      })
      .subscribe({
        next: (response) => {
          this.comments.update((items) =>
            items.map((item) =>
              item._id === comment._id ? response.data : item,
            ),
          );

          this.commentSaving.set(false);

          this.editingCommentId.set(null);

          this.editingCommentText = '';

          this.loadActivity(this.projectId());
        },

        error: (error) => {
          console.error('Update comment error:', error);

          this.commentSaving.set(false);

          this.commentError.set(
            error?.error?.message ?? 'Unable to update comment.',
          );
        },
      });
  }

  async deleteComment(comment: Comment): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete comment?',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete comment',
      cancelText: 'Keep comment',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.commentDeleting.set(comment._id);

    this.commentError.set('');

    this.commentService.deleteComment(comment._id).subscribe({
      next: () => {
        this.comments.update((items) =>
          items.filter((item) => item._id !== comment._id),
        );

        this.commentDeleting.set(null);

        this.loadActivity(this.projectId());
      },

      error: (error) => {
        console.error('Delete comment error:', error);

        this.commentDeleting.set(null);

        this.commentError.set(
          error?.error?.message ?? 'Unable to delete comment.',
        );
      },
    });
  }

  getCommentAuthorName(comment: Comment): string {
    if (!comment.createdBy) {
      return 'User';
    }

    if (typeof comment.createdBy === 'string') {
      return 'User';
    }

    return `${comment.createdBy.firstName} ${comment.createdBy.lastName}`;
  }

  getCommentInitials(comment: Comment): string {
    if (!comment.createdBy || typeof comment.createdBy === 'string') {
      return 'U';
    }

    const first = comment.createdBy.firstName?.trim().charAt(0) ?? '';
    const last = comment.createdBy.lastName?.trim().charAt(0) ?? '';

    return `${first}${last}`.toUpperCase() || 'U';
  }

  // =========================================================
  // History
  // =========================================================

  private loadHistory(taskId: string): void {
    this.historyLoading.set(true);

    this.historyError.set('');

    this.taskHistoryService.getTaskHistory(taskId).subscribe({
      next: (response) => {
        this.history.set(response.data ?? []);

        this.historyLoading.set(false);
      },

      error: (error) => {
        console.error('Load task history error:', error);

        this.historyLoading.set(false);

        this.historyError.set(
          error?.error?.message ?? 'Unable to load task history.',
        );
      },
    });
  }

  formatHistoryAction(action: string): string {
    return action
      .replace(/\_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  getHistoryUserName(item: TaskHistory): string {
    const user = item.performedBy;

    if (!user) {
      return 'System';
    }

    if (typeof user === 'string') {
      return 'User';
    }

    return `${user.firstName} ${user.lastName}`;
  }

  formatHistoryValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  // =========================================================
  // Activity
  // =========================================================

  private loadActivity(projectId: string, page = 1, append = false): void {
    if (append) {
      this.activityLoadingMore.set(true);
    } else {
      this.activityLoading.set(true);
      this.activityError.set('');
    }

    this.activityService.getProjectActivity(projectId, page, 20).subscribe({
      next: (response) => {
        const newActivities = response.data?.activities ?? [];

        this.activityPage.set(response.data?.page ?? page);
        this.activityTotal.set(response.data?.total ?? newActivities.length);

        this.activityTotalPages.set(response.data?.totalPages ?? 1);

        if (append) {
          this.activities.update((items) => {
            const existingIds = new Set(items.map((item) => item._id));

            const uniqueActivities = newActivities.filter(
              (activity) => !existingIds.has(activity._id),
            );

            return [...items, ...uniqueActivities];
          });

          this.activityLoadingMore.set(false);
        } else {
          this.activities.set(newActivities);

          this.activityLoading.set(false);
        }
      },

      error: (error) => {
        console.error('Load activity error:', error);

        if (append) {
          this.activityLoadingMore.set(false);
        } else {
          this.activityLoading.set(false);
        }

        this.activityError.set(
          error?.error?.message ?? 'Unable to load activity.',
        );
      },
    });
  }
  loadMoreActivity(): void {
    const projectId = this.projectId();

    if (!projectId) {
      return;
    }

    if (this.activityLoadingMore()) {
      return;
    }

    const currentPage = this.activityPage();

    const totalPages = this.activityTotalPages();

    if (currentPage >= totalPages) {
      return;
    }

    this.loadActivity(projectId, currentPage + 1, true);
  }

  formatActivityAction(action: string): string {
    return action
      .replace(/\_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  getActivityUserName(activity: Activity): string {
    if (!activity.user) {
      return 'System';
    }

    if (typeof activity.user === 'string') {
      return 'User';
    }

    return `${activity.user.firstName} ${activity.user.lastName}`;
  }

  getActivityInitials(activity: Activity): string {
    if (!activity.user || typeof activity.user === 'string') {
      return 'S';
    }

    const first = activity.user.firstName?.trim().charAt(0) ?? '';
    const last = activity.user.lastName?.trim().charAt(0) ?? '';

    return `${first}${last}`.toUpperCase() || 'U';
  }

  getActivityDescription(activity: Activity): string {
    const action = activity.action ?? '';
    const raw = activity as Activity & {
      description?: string;
      metadata?: Record<string, unknown>;
      details?: string;
      oldValue?: unknown;
      newValue?: unknown;
    };

    if (raw.description) {
      return raw.description;
    }

    if (raw.details) {
      return raw.details;
    }

    if (raw.oldValue !== undefined || raw.newValue !== undefined) {
      const oldValue = this.formatHistoryValue(raw.oldValue);
      const newValue = this.formatHistoryValue(raw.newValue);

      return `${oldValue} → ${newValue}`;
    }

    const metadata = raw.metadata;
    if (metadata) {
      const oldValue = metadata['oldValue'];
      const newValue = metadata['newValue'];

      if (oldValue !== undefined || newValue !== undefined) {
        return `${this.formatHistoryValue(oldValue)} → ${this.formatHistoryValue(newValue)}`;
      }
    }

    if (action.toUpperCase().includes('COMMENT')) {
      return 'Comment activity';
    }

    if (action.toUpperCase().includes('ATTACHMENT')) {
      return 'Attachment activity';
    }

    return '';
  }

  getActivityRelativeTime(value?: string | Date): string {
    if (!value) {
      return 'Just now';
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
      return 'Just now';
    }

    const diffSeconds = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / 1000),
    );

    if (diffSeconds < 10) {
      return 'Just now';
    }

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }

    const minutes = Math.floor(diffSeconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return new Date(value).toLocaleDateString();
  }

  // =========================================================
  // Attachments
  // =========================================================

  private loadAttachments(taskId: string): void {
    this.attachmentsLoading.set(true);

    this.attachmentError.set('');

    this.attachmentService.getAttachments(taskId).subscribe({
      next: (response) => {
        this.attachments.set(response.data ?? []);

        this.attachmentsLoading.set(false);
      },

      error: (error) => {
        console.error('Load attachments error:', error);

        this.attachmentsLoading.set(false);

        this.attachmentError.set(
          error?.error?.message ?? 'Unable to load attachments.',
        );
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0] ?? null;

    this.selectedFile.set(file);
  }

  uploadAttachment(): void {
    const taskId = this.task()?._id;

    const file = this.selectedFile();

    if (!taskId || !file) {
      return;
    }

    this.attachmentUploading.set(true);

    this.attachmentError.set('');

    this.attachmentService.uploadAttachment(taskId, file).subscribe({
      next: () => {
        this.attachmentUploading.set(false);

        this.selectedFile.set(null);

        this.loadAttachments(taskId);

        this.loadActivity(this.projectId());
      },

      error: (error) => {
        console.error('Upload attachment error:', error);

        this.attachmentUploading.set(false);

        this.attachmentError.set(
          error?.error?.message ?? 'Unable to upload attachment.',
        );
      },
    });
  }

  async deleteAttachment(attachment: Attachment): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete attachment?',
      message: `Are you sure you want to delete "${this.getAttachmentName(attachment)}"? This action cannot be undone.`,
      confirmText: 'Delete attachment',
      cancelText: 'Keep attachment',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.attachmentDeleting.set(attachment._id);

    this.attachmentError.set('');

    this.attachmentService.deleteAttachment(attachment._id).subscribe({
      next: () => {
        this.attachments.update((items) =>
          items.filter((item) => item._id !== attachment._id),
        );

        this.attachmentDeleting.set(null);

        this.loadActivity(this.projectId());
      },

      error: (error) => {
        console.error('Delete attachment error:', error);

        this.attachmentDeleting.set(null);

        this.attachmentError.set(
          error?.error?.message ?? 'Unable to delete attachment.',
        );
      },
    });
  }

  getAttachmentName(attachment: Attachment): string {
    return attachment.originalName ?? attachment.fileName ?? 'Attachment';
  }
  openAttachment(attachment: Attachment): void {
    this.attachmentError.set('');

    this.attachmentService.getAttachmentFile(attachment._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);

        window.open(url, '_blank');

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 60_000);
      },

      error: (error) => {
        console.error('Open attachment error:', error);

        this.attachmentError.set(
          error?.error?.message ?? 'Unable to open attachment.',
        );
      },
    });
  }
  formatFileSize(size?: number): string {
    if (!size) {
      return 'Unknown size';
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  clearSelectedFile(input?: HTMLInputElement): void {
    this.selectedFile.set(null);

    if (input) {
      input.value = '';
    }
  }

  getAttachmentIcon(attachment: Attachment): string {
    const mimeType = (attachment.mimeType ?? '').toLowerCase();
    const name = this.getAttachmentName(attachment).toLowerCase();

    if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
      return 'PDF';
    }

    if (
      mimeType.includes('image') ||
      /\.(png|jpe?g|gif|webp|svg)$/i.test(name)
    ) {
      return 'IMG';
    }

    if (mimeType.includes('word') || /\.(doc|docx)$/i.test(name)) {
      return 'DOC';
    }

    if (
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet') ||
      /\.(xls|xlsx|csv)$/i.test(name)
    ) {
      return 'XLS';
    }

    if (
      mimeType.includes('zip') ||
      mimeType.includes('compressed') ||
      /\.(zip|rar|7z)$/i.test(name)
    ) {
      return 'ZIP';
    }

    if (mimeType.includes('text') || /\.(txt|md)$/i.test(name)) {
      return 'TXT';
    }

    return 'FILE';
  }

  getAttachmentIconClass(attachment: Attachment): string {
    const type = this.getAttachmentIcon(attachment).toLowerCase();

    return `attachment-type-${type}`;
  }

  getAttachmentTypeLabel(attachment: Attachment): string {
    const mimeType = (attachment.mimeType ?? '').toLowerCase();

    if (mimeType.includes('/')) {
      const subtype = mimeType.split('/')[1];

      if (subtype) {
        return subtype.toUpperCase();
      }
    }

    const name = this.getAttachmentName(attachment);
    const extension = name.includes('.') ? name.split('.').pop() : '';

    return extension ? extension.toUpperCase() : 'FILE';
  }

  // =========================================================
  // Navigation
  // =========================================================

  goBack(): void {
    const projectId = this.projectId();

    const workspaceId = this.workspaceId();

    if (!projectId) {
      this.router.navigate(['/dashboard']);

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
  analyzeTask(): void {
    const taskId = this.task()?._id;
    const projectId = this.projectId();

    if (!taskId || !projectId) {
      return;
    }

    this.aiLoading.set(true);
    this.aiError.set('');
    this.aiAnalysis.set(null);

    this.taskAiService.analyzeTask(projectId, taskId).subscribe({
      next: (response) => {
        this.aiAnalysis.set(response.data);
        this.aiLoading.set(false);
      },

      error: (error) => {
        console.error('Task AI analysis error:', error);

        this.aiLoading.set(false);

        this.aiError.set(
          error?.error?.message ?? 'Unable to analyze this task.',
        );
      },
    });
  }
  // =========================================================
  // Edit Task
  // =========================================================

  startEditTask(): void {
    const current = this.task();

    if (!current) {
      return;
    }

    this.editTitle = current.title;

    this.editDescription = current.description ?? '';

    this.editPriority = current.priority;

    this.editDueDate = current.dueDate ?? '';

    this.editAssignedTo =
      typeof current.assignedTo === 'string'
        ? current.assignedTo
        : (current.assignedTo?._id ?? '');

    this.editError.set('');

    this.editMode.set(true);
  }

  cancelEditTask(): void {
    this.editMode.set(false);

    this.editError.set('');
  }
  private getTaskProjectId(task: Task): string {
    if (typeof task.project === 'string') {
      return task.project;
    }

    return task.project?._id ?? '';
  }
  saveTask(): void {
    const current = this.task();

    if (!current) {
      return;
    }

    const projectId = this.getTaskProjectId(current);

    if (!projectId) {
      this.editError.set('Task project is missing.');
      return;
    }

    this.savingTask.set(true);
    this.editError.set('');

    this.taskService
      .updateTask(projectId, current._id, {
        title: this.editTitle.trim(),

        description: this.editDescription.trim() || undefined,

        priority: this.editPriority,

        dueDate: this.editDueDate || undefined,

        assignedTo: this.editAssignedTo || undefined,
      })
      .subscribe({
        next: (response) => {
          this.task.set(response.data);

          this.editMode.set(false);

          this.savingTask.set(false);
        },

        error: (error) => {
          console.error('Update task error:', error);

          this.savingTask.set(false);

          this.editError.set(error?.error?.message ?? 'Unable to update task.');
        },
      });
  }
  changeTaskStatus(status: TaskStatus): void {
    const current = this.task();

    if (!current) {
      return;
    }

    const projectId = this.getTaskProjectId(current);

    if (!projectId) {
      return;
    }

    this.updatingStatus.set(true);

    this.taskService
      .updateTaskStatus(projectId, current._id, status)
      .subscribe({
        next: (response) => {
          this.task.set(response.data);

          this.showStatusMenu.set(false);

          this.updatingStatus.set(false);
        },

        error: (error) => {
          console.error('Update task status error:', error);

          this.updatingStatus.set(false);
        },
      });
  }
  toggleStatusMenu(): void {
    this.showStatusMenu.update((value) => !value);
  }
  getAssignedUserInitials(): string {
    const currentTask = this.task();

    if (
      !currentTask?.assignedTo ||
      typeof currentTask.assignedTo === 'string'
    ) {
      return 'U';
    }

    const first = currentTask.assignedTo.firstName?.trim().charAt(0) ?? '';

    const last = currentTask.assignedTo.lastName?.trim().charAt(0) ?? '';

    return `${first}${last}`.toUpperCase() || 'U';
  }

  getProjectName(): string {
    const currentTask = this.task();

    if (!currentTask?.project) {
      return 'Unknown Project';
    }

    if (typeof currentTask.project === 'string') {
      return 'Project';
    }

    return currentTask.project.name || 'Unknown Project';
  }

  isTaskOverdue(): boolean {
    const currentTask = this.task();

    if (!currentTask?.dueDate || currentTask.status === 'DONE') {
      return false;
    }

    const dueDate = new Date(currentTask.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      return false;
    }

    return dueDate.getTime() < Date.now();
  }
}
