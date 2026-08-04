import { ConflictError } from "../common/errors/ConflictError";
import { NotFoundError } from "../common/errors/NotFoundError";

import { CreateMembershipDto } from "../dto/membership/create-membership.dto";
import { UpdateMembershipDto } from "../dto/membership/update-membership.dto";

import { MembershipMapper } from "../mappers/membership.mapper";
import { MembershipRepository } from "../repositories/membership.repository";

export class MembershipService {
  private readonly membershipRepository = new MembershipRepository();

  /**
   * Add Member
   */
  async createMembership(dto: CreateMembershipDto) {
    const existing = await this.membershipRepository.findByWorkspaceAndUser(
      dto.workspace,
      dto.user,
    );

    if (existing) {
      throw new ConflictError("User is already a member of this workspace.");
    }

    const entity = MembershipMapper.toEntity(dto);

    return this.membershipRepository.create(entity);
  }

  /**
   * Get Workspace Members
   */
  async getWorkspaceMembers(workspaceId: string) {
    return this.membershipRepository.findByWorkspace(workspaceId);
  }

  /**
   * Update Role / Status
   */
  async updateMembership(id: string, dto: UpdateMembershipDto) {
    const membership = await this.membershipRepository.update(id, dto);

    if (!membership) {
      throw new NotFoundError("Membership not found");
    }

    return membership;
  }

  /**
   * Remove Member
   */
  async removeMembership(id: string) {
    const membership = await this.membershipRepository.remove(id);

    if (!membership) {
      throw new NotFoundError("Membership not found");
    }

    return membership;
  }
}
