export interface AttachmentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Attachment {
  _id: string;
  task: string;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  uploadedBy?: AttachmentUser | string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttachmentsResponse {
  success: boolean;
  message: string;
  data: Attachment[];
}

export interface AttachmentResponse {
  success: boolean;
  message: string;
  data: Attachment;
}

export interface AttachmentDeleteResponse {
  success: boolean;
  message: string;
}
