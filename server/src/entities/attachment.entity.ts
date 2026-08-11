import { CreateAttachmentDto } from "../dto/attachment/create-attachment.dto";

export class AttachmentEntity {
  task: string;
  uploadedBy: string;

  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;

  isDeleted: boolean;

  constructor(data: CreateAttachmentDto) {
    this.task = data.task;
    this.uploadedBy = data.uploadedBy;

    this.fileName = data.fileName;
    this.originalName = data.originalName;
    this.mimeType = data.mimeType;
    this.size = data.size;
    this.path = data.path;

    this.isDeleted = false;
  }
}
