import { Workspace } from "../models/workspace.model";
import { WorkspaceEntity } from "../entities/workspace.entity";
import { UpdateWorkspaceDto } from "../dto/workspace/update-workspace.dto";
import { Membership } from "../models/membership.model";
import { paginate } from "../common/pagination/pagination.util";

export class WorkspaceRepository {
  /**
   * Create Workspace
   */
  async create(entity: WorkspaceEntity) {
    return Workspace.create(entity);
  }

  /**
   * Find Workspace By Id
   *
   * User must be either:
   * - Owner
   * - Member
   */
  async findById(id: string, userId: string) {
    return Workspace.findOne({
      _id: id,
      isDeleted: { $ne: true },
      $or: [{ owner: userId }, { members: userId }],
    })
      .populate("owner", "firstName lastName email")
      .populate("members", "firstName lastName email");
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
      Workspace,
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
  async update(id: string, userId: string, dto: UpdateWorkspaceDto) {
    return Workspace.findOneAndUpdate(
      {
        _id: id,
        owner: userId,
        isDeleted: { $ne: true },
      },
      dto,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("owner", "firstName lastName email")
      .populate("members", "firstName lastName email");
  }

  /**
   * Soft Delete Workspace
   *
   * Only owner can delete.
   */
  async softDelete(id: string, userId: string) {
    return Workspace.findOneAndUpdate(
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
      },
    );
  }

  /**
   * Add Member
   */
  async addMember(workspaceId: string, userId: string) {
    return Workspace.findOneAndUpdate(
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
      },
    );
  }

  /**
   * Remove Member
   */
  async removeMember(workspaceId: string, userId: string) {
    return Workspace.findOneAndUpdate(
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
   * Find Accessible Workspace IDs
   *
   * Access comes from:
   *
   * 1. Workspace owner
   * 2. Workspace.members[]
   * 3. Active Membership record
   */
  async findAccessibleWorkspaceIds(userId: string) {
    const [workspaceMemberships, memberships] = await Promise.all([
      Workspace.find(
        {
          isDeleted: { $ne: true },
          $or: [{ owner: userId }, { members: userId }],
        },
        {
          _id: 1,
        },
      ).lean(),

      Membership.find(
        {
          user: userId,
          status: "ACTIVE",
        },
        {
          workspace: 1,
        },
      ).lean(),
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
    return Workspace.findOne({
      _id: workspaceId,
      isDeleted: { $ne: true },
    }).populate("owner", "firstName lastName email");
  }
}
