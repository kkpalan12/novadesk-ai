import { Attachment } from "../models/attachment.model";
import { AttachmentEntity } from "../entities/attachment.entity";

export class AttachmentRepository {
  /**
   * Create Attachment
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
      isDeleted: false,
    })
      .populate("uploadedBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Get Attachment By Id
   */
  async findById(id: string) {
    return Attachment.findOne({
      _id: id,
      isDeleted: false,
    }).populate("uploadedBy", "firstName lastName email");
  }

  /**
   * Soft Delete Attachment
   */
  async delete(id: string) {
    return Attachment.findOneAndUpdate(
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
