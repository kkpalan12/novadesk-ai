import { CommentRepository } from "../repositories/comment.repository";

import { CreateCommentDto } from "../dto/comment/create-comment.dto";
import { UpdateCommentDto } from "../dto/comment/update-comment.dto";

import { NotFoundError } from "../common/errors/NotFoundError";
import { ForbiddenError } from "../common/errors/ForbiddenError";

import { NotificationService } from "./notification.service";
import { ActivityService } from "./activity.service";

import { TaskRepository } from "../repositories/task.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { MembershipRepository } from "../repositories/membership.repository";

import { UserRepository } from "../repositories/user.repository";

import { MembershipRole } from "../interfaces/membership.interface";

import { ENTITY_TYPES } from "../common/constants/entity.constants";
import { ACTIVITY_ACTIONS } from "../common/constants/activity.constants";

import { SocketService } from "../socket/socket.service";

export class CommentService {
  private readonly repository = new CommentRepository();

  private readonly notificationService = new NotificationService();

  private readonly activityService = new ActivityService();

  private readonly taskRepository = new TaskRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();

  private readonly userRepository = new UserRepository();

  private readonly socketService = new SocketService();

  /**
   * Create Comment
   */
  async createComment(dto: CreateCommentDto) {
    const task = await this.getAuthorizedTask(dto.task, dto.createdBy);

    const comment = await this.repository.create(dto);

    await this.activityService.createActivity({
      project: this.getObjectId(task.project),
      user: dto.createdBy,
      action: ACTIVITY_ACTIONS.COMMENT_ADDED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Commented on "${task.title}"`,
      metadata: {
        commentId: comment._id.toString(),
      },
    });

    /**
     * Notify assigned user.
     */
    if (
      task.assignedTo &&
      this.getObjectId(task.assignedTo) !== dto.createdBy
    ) {
      const sender = await this.userRepository.findById(dto.createdBy);

      await this.notificationService.create({
        recipient: this.getObjectId(task.assignedTo),
        sender: dto.createdBy,
        type: "COMMENT_ADDED",
        title: "New Comment",
        message: `${
          sender?.firstName || "Someone"
        } commented on "${task.title}"`,
        entityType: ENTITY_TYPES.TASK,
        entityId: task._id.toString(),
      });
    }

    /**
     * Get populated comment for realtime clients.
     */
    const comments = await this.repository.findByTask(task._id.toString());

    const populatedComment = comments.find(
      (item) => String(item._id) === String(comment._id),
    );

    await this.socketService.sendCommentCreated(
      this.getObjectId(task.project),
      task._id.toString(),
      populatedComment ?? comment,
    );

    return populatedComment ?? comment;
  }

  /**
   * Get Comments
   */
  async getComments(taskId: string, userId: string) {
    await this.getAuthorizedTask(taskId, userId);

    return this.repository.findByTask(taskId);
  }

  /**
   * Update Comment
   */
  async updateComment(id: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.repository.findById(id);

    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    if (this.getObjectId(comment.createdBy) !== userId) {
      throw new ForbiddenError("You can edit only your own comments");
    }

    const task = await this.getAuthorizedTask(
      this.getObjectId(comment.task),
      userId,
    );

    const updatedComment = await this.repository.update(id, {
      ...dto,
      isEdited: true,
    });

    if (!updatedComment) {
      throw new NotFoundError("Comment not found");
    }

    await this.activityService.createActivity({
      project: this.getObjectId(task.project),
      user: userId,
      action: ACTIVITY_ACTIONS.COMMENT_UPDATED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Updated a comment on "${task.title}"`,
      metadata: {
        commentId: id,
      },
    });

    await this.socketService.sendCommentUpdated(
      this.getObjectId(task.project),
      task._id.toString(),
      updatedComment,
    );

    return updatedComment;
  }

  /**
   * Delete Comment
   */
  async deleteComment(id: string, userId: string) {
    const comment = await this.repository.findById(id);

    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    if (this.getObjectId(comment.createdBy) !== userId) {
      throw new ForbiddenError("You can delete only your own comments");
    }

    const task = await this.getAuthorizedTask(
      this.getObjectId(comment.task),
      userId,
    );

    const deletedComment = await this.repository.softDelete(id);

    if (!deletedComment) {
      throw new NotFoundError("Comment not found");
    }

    await this.activityService.createActivity({
      project: this.getObjectId(task.project),
      user: userId,
      action: ACTIVITY_ACTIONS.COMMENT_DELETED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Deleted a comment from "${task.title}"`,
      metadata: {
        commentId: id,
      },
    });

    await this.socketService.sendCommentDeleted(
      this.getObjectId(task.project),
      task._id.toString(),
      id,
    );

    return deletedComment;
  }

  /**
   * Get Task and verify workspace access.
   */
  private async getAuthorizedTask(taskId: string, userId: string) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const projectId = this.getObjectId(task.project);

    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError("Task not found");
    }

    const workspaceId = this.getObjectId(project.workspace);

    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (isOwner) {
      return task;
    }

    const membership = await this.membershipRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );

    if (!membership || membership.status !== "ACTIVE") {
      throw new NotFoundError("Task not found");
    }

    if (
      membership.role !== MembershipRole.ADMIN &&
      membership.role !== MembershipRole.MEMBER
    ) {
      throw new NotFoundError("Task not found");
    }

    return task;
  }

  /**
   * Resolve ObjectId whether populated
   * or unpopulated.
   */
  private getObjectId(value: unknown): string {
    if (value && typeof value === "object" && "_id" in value) {
      return String((value as { _id: unknown })._id);
    }

    return String(value);
  }
}
