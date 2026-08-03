import { Types } from "mongoose";

export class WorkspaceEntity {
  name: string;

  description?: string;

  owner: Types.ObjectId;

  members: Types.ObjectId[];

  logo?: string;

  isDeleted: boolean;

  constructor(data: {
    name: string;
    description?: string;
    owner: string;
    members?: string[];
    logo?: string;
  }) {
    this.name = data.name;

    this.description = data.description ?? "";

    this.owner = new Types.ObjectId(data.owner);

    this.members = (data.members ?? []).map(
      (member) => new Types.ObjectId(member),
    );

    this.logo = data.logo ?? "";

    this.isDeleted = false;
  }
}
