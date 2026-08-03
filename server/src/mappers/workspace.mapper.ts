import { WorkspaceEntity } from "../entities/workspace.entity";
import { CreateWorkspaceDto } from "../dto/workspace/create-workspace.dto";

export class WorkspaceMapper {
  static toEntity(dto: CreateWorkspaceDto, owner: string): WorkspaceEntity {
    return new WorkspaceEntity({
      name: dto.name,
      description: dto.description,
      owner,
      members: Array.from(new Set([...(dto.members ?? []), owner])),
      logo: dto.logo,
    });
  }
}
