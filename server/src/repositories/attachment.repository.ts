import { Attachment } from "../models/attachment.model";
import { AttachmentEntity } from "../entities/attachment.entity";

export class AttachmentRepository {
  /**
   * Upload Attachment
   */
  async create(entity: AttachmentEntity) {
    return Attachment.create(entity);
  }

  /**
   * Get Attachments By Task
   */
  async findByTask(taskId: string) {
    return Attachment.find({
      task: taskId,
    })
      .populate("uploadedBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Find Attachment By Id
   */
  async findById(id: string) {
    return Attachment.findById(id).populate(
      "uploadedBy",
      "firstName lastName email",
    );
  }

  /**
   * Delete Attachment
   */
  async delete(id: string) {
    return Attachment.findByIdAndDelete(id);
  }
}
