export interface CreateAttachmentDto {
  task: string;

  uploadedBy: string;

  originalName: string;

  fileName: string;

  mimeType: string;

  size: number;

  path: string;
}
