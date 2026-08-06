import { CreateActivityDto } from "../dto/activity/create-activity.dto";
import { ActivityEntity } from "../entities/activity.entity";

export class ActivityMapper {
  static toEntity(dto: CreateActivityDto): ActivityEntity {
    return {
      project: dto.project,
      user: dto.user,
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      description: dto.description,
      metadata: dto.metadata,
    };
  }
}
