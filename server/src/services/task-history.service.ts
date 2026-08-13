import { TaskHistoryRepository } from "../repositories/task-history.repository";
import { TaskAction } from "../interfaces/task-history.interface";

import { TaskRepository } from "../repositories/task.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { MembershipRepository } from "../repositories/membership.repository";

import { MembershipRole } from "../interfaces/membership.interface";

import { NotFoundError } from "../common/errors/NotFoundError";

export class TaskHistoryService {
  private readonly taskHistoryRepository = new TaskHistoryRepository();

  private readonly taskRepository = new TaskRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();

  /**
   * Create History
   *
   * Used internally by TaskService.
   */
  async createHistory(data: {
    task: string;
    action: TaskAction;
    oldValue?: string;
    newValue?: string;
    performedBy: string;
  }) {
    return this.taskHistoryRepository.create(data);
  }

  /**
   * Get Task History
   *
   * User must have active membership
   * in the Task's workspace.
   */
  async getTaskHistory(taskId: string, userId: string) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const projectId = this.getProjectId(task);

    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError("Task not found");
    }

    const workspaceId = this.getWorkspaceId(project);

    const isOwner = await this.workspaceRepository.isOwner(workspaceId, userId);

    if (isOwner) {
      return this.taskHistoryRepository.getTaskHistory(taskId);
    }

    const membership = await this.membershipRepository.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );

    if (!membership || membership.status !== "ACTIVE") {
      throw new NotFoundError("Task not found");
    }

    if (
      membership.role !== MembershipRole.ADMIN &&
      membership.role !== MembershipRole.MEMBER
    ) {
      throw new NotFoundError("Task not found");
    }

    return this.taskHistoryRepository.getTaskHistory(taskId);
  }

  /**
   * Resolve project ID from populated/unpopulated task.
   */
  private getProjectId(task: any): string {
    if (
      task.project &&
      typeof task.project === "object" &&
      "_id" in task.project
    ) {
      return String(task.project._id);
    }

    return String(task.project);
  }

  /**
   * Resolve workspace ID from populated/unpopulated project.
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
