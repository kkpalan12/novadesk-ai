import { WorkspaceRepository } from "../repositories/workspace.repository";
import { WorkspaceMapper } from "../mappers/workspace.mapper";

import { MembershipRepository } from "../repositories/membership.repository";
import { MembershipMapper } from "../mappers/membership.mapper";

import { CreateWorkspaceDto } from "../dto/workspace/create-workspace.dto";
import { UpdateWorkspaceDto } from "../dto/workspace/update-workspace.dto";

import { MembershipRole } from "../interfaces/membership.interface";

import { NotFoundError } from "../common/errors/NotFoundError";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../common/constants/constants";
import { SocketService } from "../socket/socket.service";

export class WorkspaceService {
  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();

  private readonly socketService = new SocketService();

  // =========================================
  // Create Workspace
  // =========================================

  async createWorkspace(dto: CreateWorkspaceDto, owner: string) {
    const entity = WorkspaceMapper.toEntity(dto, owner);

    const workspace = await this.workspaceRepository.create(entity);

    // =========================================
    // Create Owner Membership
    // =========================================

    const membershipEntity = MembershipMapper.toEntity({
      workspace: String(workspace._id),
      user: owner,
      role: MembershipRole.ADMIN,
    });

    await this.membershipRepository.create(membershipEntity);

    return workspace;
  }

  // =========================================
  // Get All Workspaces
  // =========================================

  async getAllWorkspaces(query: any, userId: string) {
    return this.workspaceRepository.findAll({
      page: Number(query.page) || DEFAULT_PAGE,
      limit: Number(query.limit) || DEFAULT_LIMIT,
      search: query.search,
      userId,
    });
  }

  // =========================================
  // Get Workspace By ID
  // =========================================

  async getWorkspaceById(id: string, userId: string) {
    const workspace = await this.workspaceRepository.findById(id, userId);

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return workspace;
  }

  // =========================================
  // Update Workspace
  // =========================================

  async updateWorkspace(id: string, dto: UpdateWorkspaceDto, userId: string) {
    const workspace = await this.workspaceRepository.update(id, userId, dto);

    if (!workspace) {
      throw new NotFoundError("Workspace not found or access denied");
    }

    // =========================================
    // REAL-TIME WORKSPACE UPDATE
    // =========================================

    this.socketService.sendWorkspaceUpdated(id, workspace);

    return workspace;
  }

  // =========================================
  // Delete Workspace
  // =========================================

  async deleteWorkspace(id: string, userId: string) {
    const workspace = await this.workspaceRepository.softDelete(id, userId);

    if (!workspace) {
      throw new NotFoundError("Workspace not found or access denied");
    }

    return workspace;
  }
}
