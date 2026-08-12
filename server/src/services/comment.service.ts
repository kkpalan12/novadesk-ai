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

export class CommentService {
  private readonly repository = new CommentRepository();

  private readonly notificationService = new NotificationService();
  private readonly activityService = new ActivityService();

  private readonly taskRepository = new TaskRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();

  private readonly userRepository = new UserRepository();

  /**
   * Create Comment
   */
  /**
   * Create Comment
   */
  async createComment(dto: CreateCommentDto) {
    /**
     * Verify task access BEFORE creating
     * the comment.
     */
    const task = await this.getAuthorizedTask(dto.task, dto.createdBy);

    const comment = await this.repository.create(dto);

    /**
     * Record project activity.
     */
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

    return comment;
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

    /**
     * Only comment creator can edit.
     */
    if (this.getObjectId(comment.createdBy) !== userId) {
      throw new ForbiddenError("You can edit only your own comments");
    }

    /**
     * Make sure the underlying task still
     * belongs to a workspace the user can access.
     */
    await this.getAuthorizedTask(this.getObjectId(comment.task), userId);

    const updatedComment = await this.repository.update(id, {
      ...dto,
      isEdited: true,
    });

    const task = await this.getAuthorizedTask(
      this.getObjectId(comment.task),
      userId,
    );

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

    /**
     * Only comment creator can delete.
     */
    if (this.getObjectId(comment.createdBy) !== userId) {
      throw new ForbiddenError("You can delete only your own comments");
    }

    /**
     * Verify task/workspace access.
     */
    await this.getAuthorizedTask(this.getObjectId(comment.task), userId);

    const deletedComment = await this.repository.softDelete(id);

    const task = await this.getAuthorizedTask(
      this.getObjectId(comment.task),
      userId,
    );

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

    return deletedComment;
  }

  /**
   * Get Task and verify workspace access.
   */
  private async getAuthorizedTask(taskId: string, userId: string) {
    /**
     * 1. Task
     */
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    /**
     * 2. Project
     */
    const projectId = this.getObjectId(task.project);

    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError("Task not found");
    }

    /**
     * 3. Workspace
     */
    const workspaceId = this.getObjectId(project.workspace);

    /**
     * 4. Workspace owner
     */
    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (isOwner) {
      return task;
    }

    /**
     * 5. Workspace membership
     */
    const membership = await this.membershipRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );

    if (!membership || membership.status !== "ACTIVE") {
      throw new NotFoundError("Task not found");
    }

    /**
     * Active ADMIN / MEMBER can access
     * task comments.
     */
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
  private getObjectId(value: any): string {
    if (value && typeof value === "object" && "_id" in value) {
      return String(value._id);
    }

    return String(value);
  }
}
