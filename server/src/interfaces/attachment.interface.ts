import { Document, Types } from "mongoose";

export interface IAttachment extends Document {
  task: Types.ObjectId;
  uploadedBy: Types.ObjectId;

  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}
