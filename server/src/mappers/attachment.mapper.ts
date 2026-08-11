import { AttachmentEntity } from "../entities/attachment.entity";
import { CreateAttachmentDto } from "../dto/attachment/create-attachment.dto";

export class AttachmentMapper {
  static toEntity(dto: CreateAttachmentDto): AttachmentEntity {
    return new AttachmentEntity({
      task: dto.task,
      uploadedBy: dto.uploadedBy,
      originalName: dto.originalName,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      size: dto.size,
      path: dto.path,
    });
  }
}
