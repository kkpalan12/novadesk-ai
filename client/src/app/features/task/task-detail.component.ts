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

import { Task } from '../../core/models/task.model';
import { Comment } from '../../core/models/comment.model';
import { TaskHistory } from '../../core/models/task-history.model';
import { Activity } from '../../core/models/activity.model';
import { Attachment } from '../../core/models/attachment.model';

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

  // =========================================================
  // Attachments
  // =========================================================

  readonly attachments = signal<Attachment[]>([]);

  readonly attachmentsLoading = signal(false);

  readonly attachmentUploading = signal(false);

  readonly attachmentDeleting = signal<string | null>(null);

  readonly attachmentError = signal('');

  readonly selectedFile = signal<File | null>(null);

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

    this.initializeRealtime(projectId, taskId);

    this.loadTask(projectId, taskId);
  }

  ngOnDestroy(): void {
    const projectId = this.projectId();

    if (projectId) {
      this.socketService.leaveProject(projectId);
    }
  }

  // =========================================================
  // REALTIME
  // =========================================================

  private initializeRealtime(projectId: string, taskId: string): void {
    this.socketService.connect();

    this.socketService.joinProject(projectId);

    // -----------------------------------------
    // Task Updated
    // -----------------------------------------

    this.socketService.onTaskUpdated((updatedTask: Task) => {
      if (!updatedTask?._id) {
        return;
      }

      if (updatedTask._id !== taskId) {
        return;
      }

      console.log('🔄 REAL-TIME TASK DETAIL UPDATED:', updatedTask);

      this.task.set(updatedTask);

      this.loadHistory(taskId);

      this.loadActivity(projectId);
    });

    // -----------------------------------------
    // Task Deleted
    // -----------------------------------------

    this.socketService.onTaskDeleted((data: { taskId: string }) => {
      if (data?.taskId !== taskId) {
        return;
      }

      console.log('🗑️ REAL-TIME TASK DETAIL DELETED:', taskId);

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
      .replace(/_/g, ' ')
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

  deleteComment(comment: Comment): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete this comment?',
    );

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
      .replace(/_/g, ' ')
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

  private loadActivity(projectId: string): void {
    this.activityLoading.set(true);

    this.activityError.set('');

    this.activityService.getProjectActivity(projectId, 1, 20).subscribe({
      next: (response) => {
        this.activities.set(response.data?.activities ?? []);

        this.activityLoading.set(false);
      },

      error: (error) => {
        console.error('Load activity error:', error);

        this.activityLoading.set(false);

        this.activityError.set(
          error?.error?.message ?? 'Unable to load activity.',
        );
      },
    });
  }

  formatActivityAction(action: string): string {
    return action
      .replace(/_/g, ' ')
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

  deleteAttachment(attachment: Attachment): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${this.getAttachmentName(attachment)}"?`,
    );

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
}
