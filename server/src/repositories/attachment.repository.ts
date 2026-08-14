import { ClientSession, Types } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { IAttachment } from "../interfaces/attachment.interface";
import { Attachment } from "../models/attachment.model";
import { AttachmentEntity } from "../entities/attachment.entity";

export class AttachmentRepository extends BaseRepository<IAttachment> {
  constructor() {
    super(Attachment);
  }

  /**
   * Create Attachment
   *
   * Supports both:
   * - AttachmentEntity from the service layer
   * - Partial<IAttachment> from BaseRepository contract
   *
   * Converts string IDs into MongoDB ObjectIds.
   */
  async create(
    data: Partial<IAttachment>,
    session?: ClientSession,
  ): Promise<IAttachment>;

  async create(
    entity: AttachmentEntity,
    session?: ClientSession,
  ): Promise<IAttachment>;

  async create(
    data: Partial<IAttachment> | AttachmentEntity,
    session?: ClientSession,
  ): Promise<IAttachment> {
    const normalizedData: Partial<IAttachment> = {
      ...data,

      task:
        typeof data.task === "string"
          ? new Types.ObjectId(data.task)
          : data.task,

      uploadedBy:
        typeof data.uploadedBy === "string"
          ? new Types.ObjectId(data.uploadedBy)
          : data.uploadedBy,
    };

    return super.create(normalizedData, session);
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
