import { ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";
import { paginate } from "../common/pagination/pagination.util";

import { Project } from "../models/project.model";
import { ProjectEntity } from "../entities/project.entity";
import { UpdateProjectDto } from "../dto/project/update-project.dto";

export class ProjectRepository extends BaseRepository<any> {
  constructor() {
    super(Project);
  }

  /**
   * Create Project
   */
  async create(entity: ProjectEntity, session?: ClientSession) {
    return super.create(entity, session);
  }

  /**
   * Get Project By Id
   *
   * If workspaceIds are provided, the project
   * must belong to one of those workspaces.
   */
  async findById(id: string, workspaceIds?: string[]) {
    const query: Record<string, any> = {
      _id: id,
      isDeleted: { $ne: true },
    };

    if (workspaceIds) {
      query.workspace = {
        $in: workspaceIds,
      };
    }

    return this.model
      .findOne(query)
      .populate("workspace", "name")
      .populate("owner", "firstName lastName email")
      .exec();
  }

  /**
   * Get All Projects
   *
   * Supports:
   * - Workspace filtering
   * - Search
   * - Status filtering
   * - Pagination
   */
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
      workspace: {
        $in: workspaceIds,
      },
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

    const result = await paginate(
      this.model,
      query,
      {
        page,
        limit,
      },
      (queryBuilder) =>
        queryBuilder
          .populate("workspace", "name")
          .populate("owner", "firstName lastName email")
          .sort({
            createdAt: -1,
          }),
    );

    return {
      projects: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Update Project
   *
   * Only projects belonging to the
   * supplied workspaces can be updated.
   */
  async update(
    id: string,
    dto: UpdateProjectDto,
    workspaceIds: string[],
    session?: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          workspace: {
            $in: workspaceIds,
          },
          isDeleted: { $ne: true },
        },
        dto,
        {
          new: true,
          runValidators: true,
          session,
        },
      )
      .populate("workspace", "name")
      .populate("owner", "firstName lastName email")
      .exec();
  }

  /**
   * Soft Delete Project
   */
  async softDelete(
    id: string,
    workspaceIds: string[],
    session?: ClientSession,
  ) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          workspace: {
            $in: workspaceIds,
          },
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
}
