import { AttachmentRepository } from "../repositories/attachment.repository";
import { AttachmentMapper } from "../mappers/attachment.mapper";
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

    const entity = AttachmentMapper.toEntity(dto);

    return this.attachmentRepository.create(entity);
  }

  /**
   * Get Task Attachments
   */
  async getAttachments(taskId: string) {
    return this.attachmentRepository.findByTask(taskId);
  }

  /**
   * Delete Attachment
   */
  async deleteAttachment(id: string) {
    const attachment = await this.attachmentRepository.findById(id);

    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    return this.attachmentRepository.delete(id);
  }
}
