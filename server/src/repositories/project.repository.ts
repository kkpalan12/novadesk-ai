import { ClientSession } from "mongoose";

import { BaseRepository } from "../common/repositories/base.repository";
import { paginate } from "../common/pagination/pagination.util";

import { Project } from "../models/project.model";
import { ProjectEntity } from "../entities/project.entity";
import { UpdateProjectDto } from "../dto/project/update-project.dto";
import { IProject } from "../interfaces/project.interface";

export class ProjectRepository extends BaseRepository<IProject> {
  constructor() {
    super(Project);
  }

  /**
   * Create Project
   */
  async create(
    entity: ProjectEntity,
    session?: ClientSession,
  ): Promise<IProject> {
    return super.create(entity, session);
  }

  /**
   * Get Project By Id
   *
   * Returns only non-deleted project.
   *
   * Workspace access filtering is handled
   * separately by findByIdWithWorkspaceAccess().
   */
  override async findById(id: string): Promise<IProject | null> {
    return this.model
      .findOne({
        _id: id,
        isDeleted: { $ne: true },
      })
      .populate("workspace", "name")
      .populate("owner", "firstName lastName email")
      .exec();
  }

  /**
   * Get Project By Id With Workspace Access
   *
   * The project must belong to one of the
   * supplied accessible workspaces.
   */
  async findByIdWithWorkspaceAccess(id: string, workspaceIds: string[]) {
    return this.model
      .findOne({
        _id: id,
        workspace: {
          $in: workspaceIds,
        },
        isDeleted: { $ne: true },
      })
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

    const query: Record<string, unknown> = {
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
