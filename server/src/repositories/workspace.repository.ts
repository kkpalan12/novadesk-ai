import { Workspace } from "../models/workspace.model";
import { WorkspaceEntity } from "../entities/workspace.entity";
import { UpdateWorkspaceDto } from "../dto/workspace/update-workspace.dto";

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

    const skip = (page - 1) * limit;

    const workspaces = await Workspace.find(query)
      .populate("owner", "firstName lastName email")
      .populate("members", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Workspace.countDocuments(query);

    return {
      workspaces,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
   *
   * Only owner should be allowed by service layer.
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
  async isOwner(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = await Workspace.exists({
      _id: workspaceId,
      owner: userId,
      isDeleted: { $ne: true },
    });

    return !!workspace;
  }
  async findAccessibleWorkspaceIds(userId: string) {
    const workspaces = await Workspace.find(
      {
        isDeleted: { $ne: true },
        $or: [{ owner: userId }, { members: userId }],
      },
      { _id: 1 },
    ).lean();

    return workspaces.map((workspace) => String(workspace._id));
  }
  async findOwner(workspaceId: string) {
    return Workspace.findOne({
      _id: workspaceId,
      isDeleted: { $ne: true },
    }).populate("owner", "firstName lastName email");
  }
}
