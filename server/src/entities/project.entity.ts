import { Types } from "mongoose";

export class ProjectEntity {
  workspace: Types.ObjectId;

  owner: Types.ObjectId;

  name: string;

  description?: string;

  startDate?: Date;

  endDate?: Date;

  status: "ACTIVE" | "ARCHIVED";

  isDeleted: boolean;

  constructor(data: {
    workspace: string;

    owner: string;

    name: string;

    description?: string;

    startDate?: Date;

    endDate?: Date;
  }) {
    this.workspace = new Types.ObjectId(data.workspace);

    this.owner = new Types.ObjectId(data.owner);

    this.name = data.name;

    this.description = data.description ?? "";

    this.startDate = data.startDate;

    this.endDate = data.endDate;

    this.status = "ACTIVE";

    this.isDeleted = false;
  }
}
