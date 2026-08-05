import { CommentRepository } from "../repositories/comment.repository";

import { CreateCommentDto } from "../dto/comment/create-comment.dto";
import { UpdateCommentDto } from "../dto/comment/update-comment.dto";

import { NotFoundError } from "../common/errors/NotFoundError";
import { ForbiddenError } from "../common/errors/ForbiddenError";
import { NotificationService } from "./notification.service";
import { TaskRepository } from "../repositories/task.repository";
import { UserRepository } from "../repositories/user.repository";
import { ENTITY_TYPES } from "../common/constants/entity.constants";

export class CommentService {
  private readonly repository = new CommentRepository();
  private readonly notificationService = new NotificationService();

  private readonly taskRepository = new TaskRepository();

  private readonly userRepository = new UserRepository();

  async createComment(dto: CreateCommentDto) {
    const comment = await this.repository.create(dto);

    const task = await this.taskRepository.findById(dto.task);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    if (task.assignedTo && task.assignedTo._id.toString() !== dto.createdBy) {
      const sender = await this.userRepository.findById(dto.createdBy);

      await this.notificationService.create({
        recipient: task.assignedTo._id.toString(),
        sender: dto.createdBy,
        type: "COMMENT_ADDED",
        title: "New Comment",
        message: `${sender?.firstName} commented on "${task.title}"`,
        entityType: ENTITY_TYPES.TASK,
        entityId: task._id.toString(),
      });
    }

    return comment;
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
