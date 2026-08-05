import { Schema, model, Types } from "mongoose";
import { InferSchemaType, HydratedDocument } from "mongoose";

export type CommentDocument = HydratedDocument<
  InferSchemaType<typeof commentSchema>
>;

const commentSchema = new Schema(
  {
    task: {
      type: Types.ObjectId,
      ref: "Task",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
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

export const Comment = model("Comment", commentSchema);
