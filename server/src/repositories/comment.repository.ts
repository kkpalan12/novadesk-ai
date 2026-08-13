import { ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { Comment } from "../models/comment.model";

import { CreateCommentDto } from "../dto/comment/create-comment.dto";
import { UpdateCommentDto } from "../dto/comment/update-comment.dto";

export class CommentRepository extends BaseRepository<any> {
  constructor() {
    super(Comment);
  }

  /**
   * Create Comment
   */
  async create(data: CreateCommentDto, session?: ClientSession) {
    return super.create(data, session);
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
