import { ProjectRepository } from "../repositories/project.repository";
import { ProjectMapper } from "../mappers/project.mapper";

import { CreateProjectDto } from "../dto/project/create-project.dto";
import { UpdateProjectDto } from "../dto/project/update-project.dto";

import { NotFoundError } from "../common/errors/NotFoundError";

import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../common/constants/constants";

import { WorkspaceRepository } from "../repositories/workspace.repository";
import { MembershipRepository } from "../repositories/membership.repository";

import { MembershipRole } from "../interfaces/membership.interface";

import { SocketService } from "../socket/socket.service";

export class ProjectService {
  private readonly projectRepository = new ProjectRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();

  private readonly socketService = new SocketService();

  /**
   * Create Project
   */
  async createProject(dto: CreateProjectDto, userId: string) {
    const isOwner = await this.workspaceRepository.isOwner(
      dto.workspace,
      userId,
    );

    if (!isOwner) {
      const membership = await this.membershipRepository.findActiveMembership(
        dto.workspace,
        userId,
      );

      if (!membership) {
        throw new NotFoundError("Workspace not found");
      }
    }

    const entity = ProjectMapper.toEntity(dto, userId);

    const project = await this.projectRepository.create(entity);

    this.socketService.sendProjectCreated(dto.workspace, project);

    return project;
  }

  /**
   * Get All Projects
   */
  async getAllProjects(query: any, userId: string) {
    const workspaceIds =
      await this.workspaceRepository.findAccessibleWorkspaceIds(userId);

    return this.projectRepository.findAll({
      page: Number(query.page) || DEFAULT_PAGE,

      limit: Number(query.limit) || DEFAULT_LIMIT,

      search: query.search,

      workspace: query.workspace,

      status: query.status,

      workspaceIds,
    });
  }

  /**
   * Get Project By ID
   */
  async getProjectById(id: string, userId: string) {
    const workspaceIds =
      await this.workspaceRepository.findAccessibleWorkspaceIds(userId);

    const project = await this.projectRepository.findByIdWithWorkspaceAccess(
      id,
      workspaceIds,
    );

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project;
  }

  /**
   * Update Project
   */
  async updateProject(id: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.getProjectById(id, userId);

    const workspaceId = String(project.workspace._id);

    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (!isOwner) {
      const membership = await this.membershipRepository.findActiveMembership(
        workspaceId,
        userId,
      );

      if (
        !membership ||
        ![MembershipRole.ADMIN, MembershipRole.OWNER].includes(membership.role)
      ) {
        throw new NotFoundError("Project not found");
      }
    }

    const updated = await this.projectRepository.update(id, dto, [workspaceId]);

    if (!updated) {
      throw new NotFoundError("Project not found");
    }

    this.socketService.sendProjectUpdated(workspaceId, updated);

    return updated;
  }

  /**
   * Delete Project
   */
  async deleteProject(id: string, userId: string) {
    const project = await this.getProjectById(id, userId);

    const workspaceId = String(project.workspace._id);

    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (!isOwner) {
      const membership = await this.membershipRepository.findActiveMembership(
        workspaceId,
        userId,
      );

      if (
        !membership ||
        ![MembershipRole.ADMIN, MembershipRole.OWNER].includes(membership.role)
      ) {
        throw new NotFoundError("Project not found");
      }
    }

    const deleted = await this.projectRepository.softDelete(id, [workspaceId]);

    if (!deleted) {
      throw new NotFoundError("Project not found");
    }

    return deleted;
  }
}
