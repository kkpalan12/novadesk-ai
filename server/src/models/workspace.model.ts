import mongoose, { Schema } from "mongoose";
import { IWorkspace } from "../interfaces/workspace.interface";

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    logo: {
      type: String,
      default: "",
    },

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
workspaceSchema.index({ name: "text" });

workspaceSchema.index({ owner: 1 });

workspaceSchema.index({ members: 1 });

export const Workspace = mongoose.model<IWorkspace>(
  "Workspace",
  workspaceSchema,
);
