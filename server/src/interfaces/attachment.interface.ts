import { Document, Types } from "mongoose";

export interface IAttachment extends Document {
  task: Types.ObjectId;

  uploadedBy: Types.ObjectId;

  originalName: string;

  fileName: string;

  mimeType: string;

  size: number;

  path: string;

  createdAt: Date;

  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}
