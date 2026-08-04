import { Membership } from "../models/membership.model";
import { MembershipEntity } from "../entities/membership.entity";
import { UpdateMembershipDto } from "../dto/membership/update-membership.dto";

export class MembershipRepository {
  /**
   * Create Membership
   */
  async create(entity: MembershipEntity) {
    return Membership.create(entity);
  }

  /**
   * Find Membership
   */
  async findByWorkspaceAndUser(workspaceId: string, userId: string) {
    return Membership.findOne({
      workspace: workspaceId,
      user: userId,
    });
  }

  /**
   * Get Workspace Members
   */
  async findByWorkspace(workspaceId: string) {
    return Membership.find({
      workspace: workspaceId,
      status: "ACTIVE",
    })
      .populate("user", "firstName lastName email")
      .sort({
        createdAt: 1,
      });
  }

  /**
   * Update Membership
   */
  async update(id: string, dto: UpdateMembershipDto) {
    return Membership.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Remove Member
   */
  async remove(id: string) {
    return Membership.findByIdAndUpdate(
      id,
      {
        status: "REMOVED",
      },
      {
        new: true,
      },
    );
  }
}
