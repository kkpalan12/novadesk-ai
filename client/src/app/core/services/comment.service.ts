import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  CommentResponse,
  CommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '../models/comment.model';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly api = inject(ApiService);

  getComments(taskId: string): Observable<CommentsResponse> {
    return this.api.get<CommentsResponse>(`/tasks/${taskId}/comments`);
  }

  createComment(
    taskId: string,
    data: CreateCommentRequest,
  ): Observable<CommentResponse> {
    return this.api.post<CommentResponse>(`/tasks/${taskId}/comments`, data);
  }

  updateComment(
    commentId: string,
    data: UpdateCommentRequest,
  ): Observable<CommentResponse> {
    return this.api.put<CommentResponse>(`/comments/${commentId}`, data);
  }

  deleteComment(commentId: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.api.delete<{
      success: boolean;
      message: string;
    }>(`/comments/${commentId}`);
  }
}
