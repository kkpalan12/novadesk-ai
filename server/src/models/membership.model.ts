import mongoose, { Schema } from "mongoose";

import {
  IMembership,
  MembershipRole,
  MembershipStatus,
} from "../interfaces/membership.interface";

const membershipSchema = new Schema<IMembership>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(MembershipRole),
      default: MembershipRole.MEMBER,
    },

    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * One membership per workspace
 */
membershipSchema.index(
  {
    workspace: 1,
    user: 1,
  },
  {
    unique: true,
  },
);

membershipSchema.index({
  workspace: 1,
});

membershipSchema.index({
  user: 1,
});

export const Membership = mongoose.model<IMembership>(
  "Membership",
  membershipSchema,
);
