import { ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";
import { paginate } from "../common/pagination/pagination.util";

import { Workspace } from "../models/workspace.model";
import { WorkspaceEntity } from "../entities/workspace.entity";
import { UpdateWorkspaceDto } from "../dto/workspace/update-workspace.dto";

import { Membership } from "../models/membership.model";

export class WorkspaceRepository extends BaseRepository<any> {
  constructor() {
    super(Workspace);
  }

  /**
   * Create Workspace
   */
  async create(entity: WorkspaceEntity, session?: ClientSession) {
    return super.create(entity, session);
  }

  /**
   * Find Workspace By Id
   *
   * User must be either:
   * - Owner
   * - Member
   */
  async findById(id: string, userId: string) {
    return this.model
      .findOne({
        _id: id,
        isDeleted: { $ne: true },
        $or: [{ owner: userId }, { members: userId }],
      })
      .populate("owner", "firstName lastName email")
      .populate("members", "firstName lastName email")
      .exec();
  }

  /**
   * Find All Workspaces Accessible By User
   */
  async findAll(filters: {
    page: number;
    limit: number;
    search?: string;
    userId: string;
  }) {
    const { page, limit, search, userId } = filters;

    const query: Record<string, any> = {
      isDeleted: { $ne: true },
      $or: [{ owner: userId }, { members: userId }],
    };

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    const result = await paginate(
      this.model,
      query,
      {
        page,
        limit,
      },
      (queryBuilder) =>
        queryBuilder
          .populate("owner", "firstName lastName email")
          .populate("members", "firstName lastName email")
          .sort({
            createdAt: -1,
          }),
    );

    return {
      workspaces: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Update Workspace
   *
   * Only owner can update.
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateWorkspaceDto,
    session?: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          owner: userId,
          isDeleted: { $ne: true },
        },
        dto,
        {
          new: true,
          runValidators: true,
          session,
        },
      )
      .populate("owner", "firstName lastName email")
      .populate("members", "firstName lastName email")
      .exec();
  }

  /**
   * Soft Delete Workspace
   *
   * Only owner can delete.
   */
  async softDelete(id: string, userId: string, session?: ClientSession) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          owner: userId,
          isDeleted: { $ne: true },
        },
        {
          isDeleted: true,
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }

  /**
   * Add Member
   */
  async addMember(
    workspaceId: string,
    userId: string,
    session?: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(
        {
          _id: workspaceId,
          isDeleted: { $ne: true },
        },
        {
          $addToSet: {
            members: userId,
          },
        },
        {
          new: true,
          session,
        },
      )
      .exec();
  }

  /**
   * Remove Member
   */
  async removeMember(
    workspaceId: string,
    userId: string,
    session?: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(
        {
          _id: workspaceId,
          isDeleted: { $ne: true },
        },
        {
          $pull: {
            members: userId,
          },
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
    const workspace = await this.model
      .exists({
        _id: workspaceId,
        owner: userId,
        isDeleted: { $ne: true },
      })
      .exec();

    return !!workspace;
  }

  /**
   * Find Accessible Workspace IDs
   *
   * Access comes from:
   *
   * 1. Workspace owner
   * 2. Workspace.members[]
   * 3. Active Membership record
   *
   * Membership is included as a fallback because
   * Workspace.members[] is a denormalized field.
   */
  async findAccessibleWorkspaceIds(userId: string) {
    const [workspaceMemberships, memberships] = await Promise.all([
      this.model
        .find(
          {
            isDeleted: { $ne: true },
            $or: [{ owner: userId }, { members: userId }],
          },
          {
            _id: 1,
          },
        )
        .lean()
        .exec(),

      Membership.find(
        {
          user: userId,
          status: "ACTIVE",
        },
        {
          workspace: 1,
        },
      )
        .lean()
        .exec(),
    ]);

    const workspaceIds = new Set<string>();

    for (const workspace of workspaceMemberships) {
      workspaceIds.add(String(workspace._id));
    }

    for (const membership of memberships) {
      workspaceIds.add(String(membership.workspace));
    }

    return Array.from(workspaceIds);
  }

  /**
   * Find Workspace Owner
   */
  async findOwner(workspaceId: string) {
    return this.model
      .findOne({
        _id: workspaceId,
        isDeleted: { $ne: true },
      })
      .populate("owner", "firstName lastName email")
      .exec();
  }
}
