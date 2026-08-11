import { Types } from "mongoose";

import {
  MembershipRole,
  MembershipStatus,
} from "../interfaces/membership.interface";

export class MembershipEntity {
  workspace: Types.ObjectId;

  user: Types.ObjectId;

  role: MembershipRole;

  status: MembershipStatus;

  joinedAt: Date;

  constructor(data: {
    workspace: string;
    user: string;
    role?: MembershipRole;
  }) {
    this.workspace = new Types.ObjectId(data.workspace);

    this.user = new Types.ObjectId(data.user);

    this.role = data.role ?? MembershipRole.MEMBER;

    this.status = MembershipStatus.ACTIVE;

    this.joinedAt = new Date();
  }
}
