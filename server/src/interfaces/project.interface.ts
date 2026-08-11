import { Document, Types } from "mongoose";

export interface IProject extends Document {
  workspace: Types.ObjectId;

  name: string;

  description?: string;

  owner: Types.ObjectId;

  status: "ACTIVE" | "ARCHIVED";

  startDate?: Date;

  endDate?: Date;

  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
