import { ProjectEntity } from "../entities/project.entity";
import { CreateProjectDto } from "../dto/project/create-project.dto";

export class ProjectMapper {
  static toEntity(dto: CreateProjectDto, owner: string): ProjectEntity {
    return new ProjectEntity({
      workspace: dto.workspace,
      owner,
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }
}
