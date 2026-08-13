import { ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";

import { Membership } from "../models/membership.model";
import { MembershipEntity } from "../entities/membership.entity";
import { UpdateMembershipDto } from "../dto/membership/update-membership.dto";
import { Workspace } from "../models/workspace.model";

export class MembershipRepository extends BaseRepository<any> {
  constructor() {
    super(Membership);
  }

  /**
   * Create Membership
   */
  async create(entity: MembershipEntity, session?: ClientSession) {
    return super.create(entity, session);
  }

  /**
   * Find Membership By Workspace And User
   */
  async findByWorkspaceAndUser(workspaceId: string, userId: string) {
    return this.model
      .findOne({
        workspace: workspaceId,
        user: userId,
      })
      .exec();
  }

  /**
   * Check Whether User Is An Active Member
   */
  async isMember(workspaceId: string, userId: string) {
    return !!(await this.model
      .exists({
        workspace: workspaceId,
        user: userId,
        status: "ACTIVE",
      })
      .exec());
  }

  /**
   * Get Workspace Members
   *
   * Owner is excluded because owner
   * membership is handled separately.
   */
  async findByWorkspace(workspaceId: string) {
    const workspace = await Workspace.findById(workspaceId)
      .select("owner")
      .lean()
      .exec();

    return this.model
      .find({
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
      })
      .exec();
  }

  /**
   * Find Membership By ID
   */
  async findById(id: string) {
    return this.model.findById(id).exec();
  }

  /**
   * Update Membership
   */
  async update(id: string, dto: UpdateMembershipDto, session?: ClientSession) {
    return this.model
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
        session,
      })
      .exec();
  }

  /**
   * Remove Membership
   */
  async remove(id: string, session?: ClientSession) {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          status: "REMOVED",
        },
        {
          new: true,
          session,
        },
      )
      .exec();
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
    }).exec();

    return !!workspace;
  }

  /**
   * Find Active Membership
   */
  async findActiveMembership(workspaceId: string, userId: string) {
    return this.model
      .findOne({
        workspace: workspaceId,
        user: userId,
        status: "ACTIVE",
      })
      .exec();
  }
}
