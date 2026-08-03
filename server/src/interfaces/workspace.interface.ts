import { Document, Types } from "mongoose";

export interface IWorkspace extends Document {
  name: string;

  description?: string;

  owner: Types.ObjectId;

  members: Types.ObjectId[];

  logo?: string;

  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
