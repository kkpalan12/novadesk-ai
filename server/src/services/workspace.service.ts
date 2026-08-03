import { WorkspaceRepository } from "../repositories/workspace.repository";
import { WorkspaceMapper } from "../mappers/workspace.mapper";

import { CreateWorkspaceDto } from "../dto/workspace/create-workspace.dto";
import { UpdateWorkspaceDto } from "../dto/workspace/update-workspace.dto";

import { NotFoundError } from "../common/errors/NotFoundError";

export class WorkspaceService {
  private readonly workspaceRepository = new WorkspaceRepository();

  async createWorkspace(dto: CreateWorkspaceDto, owner: string) {
    const entity = WorkspaceMapper.toEntity(dto, owner);

    return this.workspaceRepository.create(entity);
  }

  async getAllWorkspaces(query: any) {
    return this.workspaceRepository.findAll({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search,
    });
  }

  async getWorkspaceById(id: string) {
    const workspace = await this.workspaceRepository.findById(id);

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return workspace;
  }

  async updateWorkspace(id: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceRepository.update(id, dto);

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return workspace;
  }

  async deleteWorkspace(id: string) {
    const workspace = await this.workspaceRepository.softDelete(id);

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return workspace;
  }

  async addMember(workspaceId: string, userId: string) {
    const workspace = await this.workspaceRepository.addMember(
      workspaceId,
      userId,
    );

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return workspace;
  }

  async removeMember(workspaceId: string, userId: string) {
    const workspace = await this.workspaceRepository.removeMember(
      workspaceId,
      userId,
    );

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return workspace;
  }
}
