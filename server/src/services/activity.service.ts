import { ActivityRepository } from "../repositories/activity.repository";
import { ActivityMapper } from "../mappers/activity.mapper";
import { CreateActivityDto } from "../dto/activity/create-activity.dto";

import { ProjectRepository } from "../repositories/project.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { MembershipRepository } from "../repositories/membership.repository";

import { MembershipRole } from "../interfaces/membership.interface";
import { NotFoundError } from "../common/errors/NotFoundError";
import { SocketService } from "../socket/socket.service";

export class ActivityService {
  private readonly repository = new ActivityRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();
  private readonly socketService = new SocketService();

  /**
   * Create Activity
   *
   * Internal use only.
   */
  async createActivity(dto: CreateActivityDto) {
    const entity = ActivityMapper.toEntity(dto);

    const activity = await this.repository.create(entity);

    this.socketService.sendActivityCreated(dto.project, activity);

    return activity;
  }

  /**
   * Get Project Activity Feed
   */
  async getProjectActivities(
    projectId: string,
    userId?: string,
    page = 1,
    limit = 20,
  ) {
    /*
     * userId is required for HTTP access.
     * Keeping it optional prevents breaking
     * existing internal callers during migration.
     */
    if (userId) {
      await this.verifyProjectAccess(projectId, userId);
    }

    return this.repository.findByProject(projectId, page, limit);
  }

  /**
   * Get Single Activity
   */
  async getActivity(id: string, userId?: string) {
    const activity = await this.repository.findById(id);

    if (!activity) {
      throw new NotFoundError("Activity not found");
    }

    if (userId) {
      const projectId = this.getProjectId(activity);

      await this.verifyProjectAccess(projectId, userId);
    }

    return activity;
  }

  /**
   * Delete Activity
   */
  async deleteActivity(id: string) {
    const activity = await this.repository.delete(id);

    if (!activity) {
      throw new NotFoundError("Activity not found");
    }

    return activity;
  }

  /**
   * Verify Project Access
   */
  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const workspaceId = this.getWorkspaceId(project);

    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (isOwner) {
      return {
        project,
        role: MembershipRole.OWNER,
      };
    }

    const membership = await this.membershipRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );

    if (!membership || membership.status !== "ACTIVE") {
      throw new NotFoundError("Project not found");
    }

    if (
      membership.role !== MembershipRole.ADMIN &&
      membership.role !== MembershipRole.MEMBER
    ) {
      throw new NotFoundError("Project not found");
    }

    return {
      project,
      role: membership.role,
    };
  }

  /**
   * Get Project ID from Activity
   */
  private getProjectId(activity: any): string {
    if (
      activity.project &&
      typeof activity.project === "object" &&
      "_id" in activity.project
    ) {
      return String(activity.project._id);
    }

    return String(activity.project);
  }

  /**
   * Get Workspace ID from Project
   */
  private getWorkspaceId(project: any): string {
    if (
      project.workspace &&
      typeof project.workspace === "object" &&
      "_id" in project.workspace
    ) {
      return String(project.workspace._id);
    }

    return String(project.workspace);
  }
}
