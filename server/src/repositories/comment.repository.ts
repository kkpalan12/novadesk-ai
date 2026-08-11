import { Comment } from "../models/comment.model";

import { CreateCommentDto } from "../dto/comment/create-comment.dto";
import { UpdateCommentDto } from "../dto/comment/update-comment.dto";

export class CommentRepository {
  /**
   * Create Comment
   */
  async create(data: CreateCommentDto) {
    return Comment.create(data);
  }

  /**
   * Get Task Comments
   */
  async findByTask(taskId: string) {
    return Comment.find({
      task: taskId,
      isDeleted: false,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Find Comment
   */
  async findById(id: string) {
    return Comment.findOne({
      _id: id,
      isDeleted: false,
    });
  }

  /**
   * Update Comment
   */
  async update(id: string, data: Partial<UpdateCommentDto>) {
    return Comment.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      data,
      {
        new: true,
        runValidators: true,
      },
    );
  }

  /**
   * Soft Delete Comment
   */
  async softDelete(id: string) {
    return Comment.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
      },
      {
        new: true,
      },
    );
  }
}
