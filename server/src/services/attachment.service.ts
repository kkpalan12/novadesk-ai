import { AttachmentRepository } from "../repositories/attachment.repository";
import { AttachmentEntity } from "../entities/attachment.entity";
import { CreateAttachmentDto } from "../dto/attachment/create-attachment.dto";

import { NotFoundError } from "../common/errors/NotFoundError";

import { TaskRepository } from "../repositories/task.repository";

import { ActivityService } from "./activity.service";

import { ACTIVITY_ACTIONS } from "../common/constants/activity.constants";
import { ENTITY_TYPES } from "../common/constants/entity.constants";

export class AttachmentService {
  private readonly attachmentRepository = new AttachmentRepository();

  private readonly taskRepository = new TaskRepository();

  private readonly activityService = new ActivityService();

  /**
   * Upload Attachment
   */
  async uploadAttachment(dto: CreateAttachmentDto) {
    const task = await this.taskRepository.findById(dto.task);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const entity = new AttachmentEntity(dto);

    const attachment = await this.attachmentRepository.create(entity);

    /**
     * Record project activity.
     */
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
  async getAttachments(taskId: string) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const attachments = await this.attachmentRepository.findByTask(taskId);

    return attachments.map((attachment) => this.addUrl(attachment));
  }

  /**
   * Get Attachment By Id
   */
  async getAttachment(id: string) {
    const attachment = await this.attachmentRepository.findById(id);

    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    return this.addUrl(attachment);
  }

  /**
   * Delete Attachment
   */
  async deleteAttachment(id: string) {
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

    await this.attachmentRepository.delete(id);

    /**
     * Record project activity.
     */
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
   * Add public file URL.
   */
  private addUrl(attachment: any) {
    return {
      ...(attachment.toObject?.() ?? attachment),
      url: `/uploads/${attachment.path}`,
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
   * Resolve ObjectId from populated/unpopulated value.
   */
  private getObjectId(value: any): string {
    if (value && typeof value === "object" && "_id" in value) {
      return String(value._id);
    }

    return String(value);
  }
}
