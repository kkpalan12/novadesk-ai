import { AttachmentRepository } from "../repositories/attachment.repository";
import { AttachmentEntity } from "../entities/attachment.entity";
import { CreateAttachmentDto } from "../dto/attachment/create-attachment.dto";

import { NotFoundError } from "../common/errors/NotFoundError";

import { TaskRepository } from "../repositories/task.repository";

export class AttachmentService {
  private readonly attachmentRepository = new AttachmentRepository();

  private readonly taskRepository = new TaskRepository();

  /**
   * Upload Attachment
   */
  async uploadAttachment(dto: CreateAttachmentDto) {
    const task = await this.taskRepository.findById(dto.task);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const entity = new AttachmentEntity(dto);

    return this.attachmentRepository.create(entity);
  }

  /**
   * Get Task Attachments
   */
  async getAttachments(taskId: string) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return this.attachmentRepository.findByTask(taskId);
  }

  /**
   * Get Attachment By Id
   */
  async getAttachment(id: string) {
    const attachment = await this.attachmentRepository.findById(id);

    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    return attachment;
  }

  /**
   * Delete Attachment
   */
  async deleteAttachment(id: string) {
    const attachment = await this.attachmentRepository.delete(id);

    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    return attachment;
  }
}
