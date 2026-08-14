import { ClientSession, Types } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { Comment, IComment } from "../models/comment.model";

import { CreateCommentDto } from "../dto/comment/create-comment.dto";
import { UpdateCommentDto } from "../dto/comment/update-comment.dto";

export class CommentRepository extends BaseRepository<IComment> {
  constructor() {
    super(Comment);
  }

  /**
   * Create Comment
   *
   * BaseRepository-compatible signature.
   */
  async create(
    data: Partial<IComment>,
    session?: ClientSession,
  ): Promise<IComment>;

  /**
   * DTO-compatible signature.
   */
  async create(
    data: CreateCommentDto,
    session?: ClientSession,
  ): Promise<IComment>;

  /**
   * Create Comment
   */
  async create(
    data: Partial<IComment> | CreateCommentDto,
    session?: ClientSession,
  ): Promise<IComment> {
    const normalizedData: Partial<IComment> = {};

    if ("task" in data && data.task !== undefined) {
      normalizedData.task =
        typeof data.task === "string"
          ? new Types.ObjectId(data.task)
          : data.task;
    }

    if ("content" in data && data.content !== undefined) {
      normalizedData.content = data.content;
    }

    if ("createdBy" in data && data.createdBy !== undefined) {
      normalizedData.createdBy =
        typeof data.createdBy === "string"
          ? new Types.ObjectId(data.createdBy)
          : data.createdBy;
    }

    if ("isEdited" in data && data.isEdited !== undefined) {
      normalizedData.isEdited = data.isEdited;
    }

    if ("isDeleted" in data && data.isDeleted !== undefined) {
      normalizedData.isDeleted = data.isDeleted;
    }

    return super.create(normalizedData, session);
  }

  /**
   * Get Task Comments
   */
  async findByTask(taskId: string) {
    return this.model
      .find({
        task: taskId,
        isDeleted: false,
      })
      .populate("createdBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  /**
   * Find Comment
   */
  async findById(id: string) {
    return this.model
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate("createdBy", "firstName lastName email")
      .exec();
  }

  /**
   * Update Comment
   */
  async update(
    id: string,
    data: Partial<UpdateCommentDto>,
    session?: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        data,
        {
          new: true,
          runValidators: true,
          session,
        },
      )
      .populate("createdBy", "firstName lastName email")
      .exec();
  }

  /**
   * Soft Delete Comment
   */
  async softDelete(id: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }
}
