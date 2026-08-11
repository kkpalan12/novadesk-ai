import { Document, Types } from "mongoose";

export enum MembershipRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  INVITED = "INVITED",
  REMOVED = "REMOVED",
}

export interface IMembership extends Document {
  workspace: Types.ObjectId;

  user: Types.ObjectId;

  role: MembershipRole;

  status: MembershipStatus;

  joinedAt: Date;

  createdAt: Date;

  updatedAt: Date;
}
