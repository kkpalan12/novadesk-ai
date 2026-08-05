import { CommentRepository } from "../repositories/comment.repository";

import { CreateCommentDto } from "../dto/comment/create-comment.dto";
import { UpdateCommentDto } from "../dto/comment/update-comment.dto";

import { NotFoundError } from "../common/errors/NotFoundError";
import { ForbiddenError } from "../common/errors/ForbiddenError";

export class CommentService {
  private readonly repository = new CommentRepository();

  async createComment(dto: CreateCommentDto) {
    return this.repository.create(dto);
  }

  async getComments(taskId: string) {
    return this.repository.findByTask(taskId);
  }

  async updateComment(id: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.repository.findById(id);

    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    if (comment.createdBy.toString() !== userId) {
      throw new ForbiddenError("You can edit only your own comments");
    }

    return this.repository.update(id, {
      ...dto,
      isEdited: true,
    });
  }

  async deleteComment(id: string, userId: string) {
    const comment = await this.repository.findById(id);

    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    if (comment.createdBy.toString() !== userId) {
      throw new ForbiddenError("You can delete only your own comments");
    }

    return this.repository.softDelete(id);
  }
}
