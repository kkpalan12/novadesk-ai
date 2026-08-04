import { Project } from "../models/project.model";
import { ProjectEntity } from "../entities/project.entity";
import { UpdateProjectDto } from "../dto/project/update-project.dto";

export class ProjectRepository {
  /**
   * Create Project
   */
  async create(entity: ProjectEntity) {
    return Project.create(entity);
  }

  /**
   * Get Project By Id
   */
  async findById(id: string) {
    return Project.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate("workspace", "name")
      .populate("owner", "firstName lastName email");
  }

  /**
   * Get All Projects
   */
  async findAll(filters: {
    page: number;
    limit: number;
    search?: string;
    workspace?: string;
    status?: string;
  }) {
    const { page, limit, search, workspace, status } = filters;

    const query: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    if (workspace) {
      query.workspace = workspace;
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
   * Update Project
   */
  async update(id: string, dto: UpdateProjectDto) {
    return Project.findOneAndUpdate(
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
    return Project.findOneAndUpdate(
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
}
