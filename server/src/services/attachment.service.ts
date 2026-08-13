import { AttachmentRepository } from "../repositories/attachment.repository";
import { AttachmentEntity } from "../entities/attachment.entity";
import { CreateAttachmentDto } from "../dto/attachment/create-attachment.dto";

import { NotFoundError } from "../common/errors/NotFoundError";

import { TaskRepository } from "../repositories/task.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { MembershipRepository } from "../repositories/membership.repository";

import { ActivityService } from "./activity.service";

import { ACTIVITY_ACTIONS } from "../common/constants/activity.constants";
import { ENTITY_TYPES } from "../common/constants/entity.constants";

import { env } from "../config/env";

import fs from "fs/promises";
import path from "path";

export class AttachmentService {
  private readonly attachmentRepository = new AttachmentRepository();

  private readonly taskRepository = new TaskRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();

  private readonly activityService = new ActivityService();

  /**
   * Upload Attachment
   */
  async uploadAttachment(dto: CreateAttachmentDto) {
    const task = await this.taskRepository.findById(dto.task);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.verifyTaskAccess(task, dto.uploadedBy);

    const entity = new AttachmentEntity(dto);

    const attachment = await this.attachmentRepository.create(entity);

    await this.activityService.createActivity({
      project: this.getProjectId(task),
      user: dto.uploadedBy,
      action: ACTIVITY_ACTIONS.ATTACHMENT_UPLOADED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Uploaded attachment "${dto.originalName}" to "${task.title}"`,
      metadata: {
        attachmentId: attachment._id.toString(),
      },
    });

    return this.addUrl(attachment);
  }

  /**
   * Get Task Attachments
   */
  async getAttachments(taskId: string, userId: string) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.verifyTaskAccess(task, userId);

    const attachments = await this.attachmentRepository.findByTask(taskId);

    return attachments.map((attachment) => this.addUrl(attachment));
  }

  /**
   * Get Attachment By Id
   */
  async getAttachment(id: string, userId: string) {
    const attachment = await this.attachmentRepository.findById(id);

    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    const task = await this.taskRepository.findById(
      this.getObjectId(attachment.task),
    );

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.verifyTaskAccess(task, userId);

    return this.addUrl(attachment);
  }

  /**
   * Delete Attachment
   */
  async deleteAttachment(id: string, userId: string) {
    const attachment = await this.attachmentRepository.findById(id);

    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    const task = await this.taskRepository.findById(
      this.getObjectId(attachment.task),
    );

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.verifyTaskAccess(task, userId);

    await this.attachmentRepository.delete(id);

    await this.deletePhysicalFile(attachment.path);

    await this.activityService.createActivity({
      project: this.getProjectId(task),
      user: this.getObjectId(attachment.uploadedBy),
      action: ACTIVITY_ACTIONS.ATTACHMENT_DELETED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Deleted attachment "${attachment.originalName}" from "${task.title}"`,
      metadata: {
        attachmentId: id,
      },
    });

    return attachment;
  }

  /**
   * Verify whether user can access the task.
   *
   * Workspace owner and active workspace members
   * can access task attachments.
   */
  private async verifyTaskAccess(task: any, userId: string): Promise<void> {
    const projectId = this.getProjectId(task);

    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const workspaceId = this.getWorkspaceId(project);

    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (isOwner) {
      return;
    }

    const membership = await this.membershipRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );

    if (!membership || membership.status !== "ACTIVE") {
      throw new NotFoundError("Task not found");
    }
  }

  /**
   * Add public file URL.
   */
  private addUrl(attachment: any) {
    return {
      ...(attachment.toObject?.() ?? attachment),

      url: `${env.PUBLIC_API_URL}/uploads/${attachment.path}`,
    };
  }

  /**
   * Resolve project ID from populated/unpopulated task.
   */
  private getProjectId(task: any): string {
    if (
      task.project &&
      typeof task.project === "object" &&
      "_id" in task.project
    ) {
      return String(task.project._id);
    }

    return String(task.project);
  }

  /**
   * Resolve workspace ID from populated/unpopulated project.
   */
  private getWorkspaceId(project: any): string {
    if (
      project.workspace &&
      typeof project.workspace === "object" &&
      "_id" in project.workspace
    ) {
      return String(project.workspace._id);
    }

    return String(project.workspace);
  }

  /**
   * Resolve ObjectId from populated/unpopulated value.
   */
  private getObjectId(value: any): string {
    if (value && typeof value === "object" && "_id" in value) {
      return String(value._id);
    }

    return String(value);
  }

  /**
   * Delete physical uploaded file.
   */
  private async deletePhysicalFile(filePath: string): Promise<void> {
    const absolutePath = path.join(process.cwd(), "uploads", filePath);

    try {
      await fs.unlink(absolutePath);
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }
}
