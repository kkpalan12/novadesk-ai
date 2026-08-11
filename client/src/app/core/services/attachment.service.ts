import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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
}
