import { Membership } from "../models/membership.model";
import { MembershipEntity } from "../entities/membership.entity";
import { UpdateMembershipDto } from "../dto/membership/update-membership.dto";
import { Workspace } from "../models/workspace.model";

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
   * Check whether user is an active member
   */
  async isMember(workspaceId: string, userId: string) {
    return Membership.exists({
      workspace: workspaceId,
      user: userId,
      status: "ACTIVE",
    });
  }

  /**
   * Get Workspace Members
   */
  async findByWorkspace(workspaceId: string) {
    const workspace = await Workspace.findById(workspaceId)
      .select("owner")
      .lean();

    const memberships = await Membership.find({
      workspace: workspaceId,
      status: "ACTIVE",
      ...(workspace?.owner
        ? {
            user: {
              $ne: workspace.owner,
            },
          }
        : {}),
    })
      .populate("user", "firstName lastName email")
      .sort({
        createdAt: 1,
      });

    return memberships;
  }

  /**
   * Find Membership By ID
   */
  async findById(id: string) {
    return Membership.findById(id);
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
   * Remove Membership
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

  /**
   * Check Workspace Owner
   */
  async isOwner(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = await Workspace.exists({
      _id: workspaceId,
      owner: userId,
      isDeleted: {
        $ne: true,
      },
    });

    return !!workspace;
  }

  /**
   * Find Active Membership
   */
  async findActiveMembership(workspaceId: string, userId: string) {
    return Membership.findOne({
      workspace: workspaceId,
      user: userId,
      status: "ACTIVE",
    });
  }
}
