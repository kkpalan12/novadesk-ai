import mongoose, { Schema } from "mongoose";

import { IProject } from "../interfaces/project.interface";

const projectSchema = new Schema<IProject>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },

    startDate: Date,

    endDate: Date,

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Indexes
 */
projectSchema.index({
  workspace: 1,
});

projectSchema.index({
  owner: 1,
});

projectSchema.index({
  name: "text",
});

/**
 * Project listing optimization
 *
 * Supports:
 * - Workspace filtering
 * - Soft-delete filtering
 * - Created date sorting
 */
projectSchema.index({
  workspace: 1,
  isDeleted: 1,
  createdAt: -1,
});

export const Project = mongoose.model<IProject>("Project", projectSchema);
