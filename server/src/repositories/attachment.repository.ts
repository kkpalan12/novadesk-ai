import { ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { Attachment } from "../models/attachment.model";
import { AttachmentEntity } from "../entities/attachment.entity";

export class AttachmentRepository extends BaseRepository<any> {
  constructor() {
    super(Attachment);
  }

  /**
   * Create Attachment
   */
  async create(entity: AttachmentEntity, session?: ClientSession) {
    return super.create(entity, session);
  }

  /**
   * Get Attachments By Task
   */
  async findByTask(taskId: string) {
    return this.model
      .find({
        task: taskId,
        isDeleted: false,
      })
      .populate("uploadedBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  /**
   * Get Attachment By Id
   */
  async findById(id: string) {
    return this.model
      .findOne({
        _id: id,
        isDeleted: false,
      })
      .populate("uploadedBy", "firstName lastName email")
      .exec();
  }

  /**
   * Soft Delete Attachment
   */
  async delete(id: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }
}
