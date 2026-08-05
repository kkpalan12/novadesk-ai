import { Types } from "mongoose";

export class AttachmentEntity {
  task: Types.ObjectId;

  uploadedBy: Types.ObjectId;

  originalName: string;

  fileName: string;

  mimeType: string;

  size: number;

  path: string;

  constructor(data: {
    task: string;
    uploadedBy: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    path: string;
  }) {
    this.task = new Types.ObjectId(data.task);

    this.uploadedBy = new Types.ObjectId(data.uploadedBy);

    this.originalName = data.originalName;

    this.fileName = data.fileName;

    this.mimeType = data.mimeType;

    this.size = data.size;

    this.path = data.path;
  }
}
