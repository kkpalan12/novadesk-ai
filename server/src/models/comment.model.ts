import {
  Schema,
  model,
  Types,
  InferSchemaType,
  HydratedDocument,
} from "mongoose";

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

/**
 * Indexes
 */
commentSchema.index({
  task: 1,
  createdAt: -1,
});

commentSchema.index({
  createdBy: 1,
});

export type CommentDocument = HydratedDocument<
  InferSchemaType<typeof commentSchema>
>;

export const Comment = model("Comment", commentSchema);
