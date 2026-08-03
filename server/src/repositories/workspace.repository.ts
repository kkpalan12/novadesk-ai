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
   */
  async findById(id: string) {
    return Workspace.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate("owner", "firstName lastName email")
      .populate("members", "firstName lastName email");
  }

  /**
   * Find All Workspaces
   */
  async findAll(filters: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = filters;

    const query: Record<string, any> = {
      isDeleted: { $ne: true },
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
   */
  async update(id: string, dto: UpdateWorkspaceDto) {
    return Workspace.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $ne: true },
      },
      dto,
      {
        new: true,
        runValidators: true,
      },
    );
  }

  /**
   * Soft Delete
   */
  async softDelete(id: string) {
    return Workspace.findOneAndUpdate(
      {
        _id: id,
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
    return Workspace.findByIdAndUpdate(
      workspaceId,
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
    return Workspace.findByIdAndUpdate(
      workspaceId,
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
}
