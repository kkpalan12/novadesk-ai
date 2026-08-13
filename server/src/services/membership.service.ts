import { ConflictError } from "../common/errors/ConflictError";
import { NotFoundError } from "../common/errors/NotFoundError";

import { CreateMembershipDto } from "../dto/membership/create-membership.dto";
import { UpdateMembershipDto } from "../dto/membership/update-membership.dto";

import { MembershipMapper } from "../mappers/membership.mapper";
import { MembershipRepository } from "../repositories/membership.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";

export class MembershipService {
  private readonly membershipRepository = new MembershipRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  /**
   * Add Member
   *
   * Only workspace owner can add members.
   *
   * Keeps:
   * - Membership collection
   * - Workspace.members[]
   *
   * synchronized.
   */
  async createMembership(dto: CreateMembershipDto, actorUserId: string) {
    const isOwner = await this.workspaceRepository.isOwner(
      dto.workspace,
      actorUserId,
    );

    if (!isOwner) {
      throw new NotFoundError("Workspace not found");
    }

    const existing = await this.membershipRepository.findByWorkspaceAndUser(
      dto.workspace,
      dto.user,
    );

    if (existing && existing.status === "ACTIVE") {
      throw new ConflictError("User is already a member of this workspace");
    }

    const entity = MembershipMapper.toEntity(dto);

    const membership = await this.membershipRepository.create(entity);

    const workspace = await this.workspaceRepository.addMember(
      dto.workspace,
      dto.user,
    );

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    return membership;
  }

  /**
   * Get Workspace Members
   *
   * Owner or active member can view members.
   */
  async getWorkspaceMembers(workspaceId: string, actorUserId: string) {
    const isOwner = await this.workspaceRepository.isOwner(
      workspaceId,
      actorUserId,
    );

    if (!isOwner) {
      const isMember = await this.membershipRepository.isMember(
        workspaceId,
        actorUserId,
      );

      if (!isMember) {
        throw new NotFoundError("Workspace not found");
      }
    }

    return this.membershipRepository.findByWorkspace(workspaceId);
  }

  /**
   * Update Role / Status
   *
   * Only workspace owner can update membership.
   */
  async updateMembership(
    id: string,
    dto: UpdateMembershipDto,
    actorUserId: string,
  ) {
    const membership = await this.membershipRepository.findById(id);

    if (!membership) {
      throw new NotFoundError("Membership not found");
    }

    const isOwner = await this.workspaceRepository.isOwner(
      String(membership.workspace),
      actorUserId,
    );

    if (!isOwner) {
      throw new NotFoundError("Membership not found");
    }

    const updated = await this.membershipRepository.update(id, dto);

    if (!updated) {
      throw new NotFoundError("Membership not found");
    }

    return updated;
  }

  /**
   * Remove Member
   *
   * Only workspace owner can remove members.
   */
  async removeMembership(id: string, actorUserId: string) {
    const membership = await this.membershipRepository.findById(id);

    if (!membership) {
      throw new NotFoundError("Membership not found");
    }

    const workspaceId = String(membership.workspace);

    const userId = String(membership.user);

    const isOwner = await this.workspaceRepository.isOwner(
      workspaceId,
      actorUserId,
    );

    if (!isOwner) {
      throw new NotFoundError("Membership not found");
    }

    const removed = await this.membershipRepository.remove(id);

    if (!removed) {
      throw new NotFoundError("Membership not found");
    }

    await this.workspaceRepository.removeMember(workspaceId, userId);

    return removed;
  }
}
