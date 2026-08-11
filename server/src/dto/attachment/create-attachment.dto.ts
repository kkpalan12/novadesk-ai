export interface CreateAttachmentDto {
  task: string;
  uploadedBy: string;

  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}
