import { Project } from "../models/project.model";
import { ProjectEntity } from "../entities/project.entity";
import { UpdateProjectDto } from "../dto/project/update-project.dto";

export class ProjectRepository {
  async create(entity: ProjectEntity) {
    return Project.create(entity);
  }

  /**
   * Get project only when the user belongs
   * to the project's workspace.
   */
  async findById(id: string, workspaceIds?: string[]) {
    const query: Record<string, any> = {
      _id: id,
      isDeleted: { $ne: true },
    };

    if (workspaceIds) {
      query.workspace = { $in: workspaceIds };
    }

    return Project.findOne(query)
      .populate("workspace", "name")
      .populate("owner", "firstName lastName email");
  }

  async findAll(filters: {
    page: number;
    limit: number;
    search?: string;
    workspaceIds: string[];
    workspace?: string;
    status?: string;
  }) {
    const { page, limit, search, workspaceIds, workspace, status } = filters;

    const query: Record<string, any> = {
      isDeleted: { $ne: true },
      workspace: { $in: workspaceIds },
    };

    if (workspace) {
      query.workspace = workspaceIds.includes(workspace)
        ? workspace
        : { $in: [] };
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    const skip = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate("workspace", "name")
      .populate("owner", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);

    return {
      projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Only OWNER / ADMIN authorization should reach this method.
   */
  async update(id: string, dto: UpdateProjectDto, workspaceIds: string[]) {
    return Project.findOneAndUpdate(
      {
        _id: id,
        workspace: { $in: workspaceIds },
        isDeleted: { $ne: true },
      },
      dto,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("workspace", "name")
      .populate("owner", "firstName lastName email");
  }

  async softDelete(id: string, workspaceIds: string[]) {
    return Project.findOneAndUpdate(
      {
        _id: id,
        workspace: { $in: workspaceIds },
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
}
