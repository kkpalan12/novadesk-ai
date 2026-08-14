import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApiService } from './api.service';

import {
  Attachment,
  AttachmentDeleteResponse,
  AttachmentResponse,
  AttachmentsResponse,
} from '../models/attachment.model';

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  private readonly api = inject(ApiService);

  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  getAttachments(taskId: string): Observable<AttachmentsResponse> {
    return this.api.get<AttachmentsResponse>(`/tasks/${taskId}/attachments`);
  }

  uploadAttachment(taskId: string, file: File): Observable<AttachmentResponse> {
    const formData = new FormData();

    formData.append('file', file);

    return this.api.post<AttachmentResponse>(
      `/tasks/${taskId}/attachments`,
      formData,
    );
  }

  deleteAttachment(attachmentId: string): Observable<AttachmentDeleteResponse> {
    return this.api.delete<AttachmentDeleteResponse>(
      `/attachments/${attachmentId}`,
    );
  }

  /**
   * Open protected attachment file.
   *
   * HttpClient is used so the auth interceptor
   * automatically attaches the access token.
   */
  getAttachmentFile(attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/attachments/${attachmentId}/file`, {
      responseType: 'blob',
    });
  }
}
