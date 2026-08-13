import { TaskRepository } from "../repositories/task.repository";
import { ProjectRepository } from "../repositories/project.repository";

import { TaskMapper } from "../mappers/task.mapper";

import { CreateTaskDto } from "../dto/task/create-task.dto";
import { UpdateTaskDto } from "../dto/task/update-task.dto";

import { NotFoundError } from "../common/errors/NotFoundError";

import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../common/constants/constants";

import { ENTITY_TYPES } from "../common/constants/entity.constants";
import { ACTIVITY_ACTIONS } from "../common/constants/activity.constants";

import { TaskHistoryService } from "./task-history.service";
import { NotificationService } from "./notification.service";
import { ActivityService } from "./activity.service";

import { SocketService } from "../socket/socket.service";

import { WorkspaceRepository } from "../repositories/workspace.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MembershipRole } from "../interfaces/membership.interface";

export class TaskService {
  private readonly taskRepository = new TaskRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly taskHistoryService = new TaskHistoryService();

  private readonly notificationService = new NotificationService();

  private readonly activityService = new ActivityService();

  private readonly socketService = new SocketService();

  private readonly workspaceRepository = new WorkspaceRepository();

  private readonly membershipRepository = new MembershipRepository();

  // =========================================
  // CREATE TASK
  // =========================================

  async createTask(dto: CreateTaskDto, createdBy: string) {
    if (!dto.project) {
      throw new NotFoundError("Project not found");
    }

    const projectId = dto.project;

    const access = await this.getProjectAccess(projectId, createdBy);

    if (!this.canCreateTasks(access.role)) {
      throw new NotFoundError("Project not found");
    }

    // Validate assignee when provided
    if (dto.assignedTo) {
      const workspaceId = this.getWorkspaceId(access.project);

      await this.validateWorkspaceAssignee(workspaceId, dto.assignedTo);
    }

    const entity = TaskMapper.toEntity(dto, createdBy);

    const task = await this.taskRepository.create(entity);

    await this.activityService.createActivity({
      project: projectId,
      user: createdBy,
      action: ACTIVITY_ACTIONS.TASK_CREATED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Created task "${task.title}"`,
      metadata: {
        priority: task.priority,
        status: task.status,
      },
    });

    this.socketService.sendTaskCreated(projectId, task);

    return task;
  }

  // =========================================
  // GET ALL TASKS
  // =========================================

  async getAllTasks(query: any, userId: string) {
    if (!query.project) {
      throw new NotFoundError("Project not found");
    }

    await this.getProjectAccess(query.project, userId);

    return this.taskRepository.findAll({
      page: Number(query.page) || DEFAULT_PAGE,
      limit: Number(query.limit) || DEFAULT_LIMIT,
      project: query.project,
      search: query.search,
      status: query.status,
      priority: query.priority,
      sort: query.sort,
    });
  }

  // =========================================
  // GET TASK BY ID
  // =========================================

  async getTaskById(id: string, projectId: string, userId: string) {
    await this.getProjectAccess(projectId, userId);

    const task = await this.taskRepository.findById(id, projectId);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return task;
  }

  // =========================================
  // UPDATE TASK
  // =========================================

  async updateTask(id: string, dto: UpdateTaskDto, userId: string) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new NotFoundError("Task not found");
    }

    const projectId = this.getProjectId(existingTask);

    const access = await this.getProjectAccess(projectId, userId);

    // =========================================
    // OWNER / ADMIN
    // =========================================

    if (this.canManageTasks(access.role)) {
      const task = await this.taskRepository.update(id, dto);

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      await this.taskHistoryService.createHistory({
        task: task._id.toString(),
        action: "UPDATED",
        performedBy: userId,
      });

      await this.activityService.createActivity({
        project: this.getProjectId(task),
        user: userId,
        action: ACTIVITY_ACTIONS.TASK_UPDATED,
        entityType: ENTITY_TYPES.TASK,
        entityId: task._id.toString(),
        description: `Updated task "${task.title}"`,
      });

      this.socketService.sendTaskUpdate(this.getProjectId(task), task);

      return task;
    }

    // =========================================
    // MEMBER
    // =========================================

    if (access.role === MembershipRole.MEMBER) {
      const assignedTo = existingTask.assignedTo
        ? this.getUserId(existingTask.assignedTo)
        : null;

      // Member can only update their own task
      if (assignedTo !== userId) {
        throw new NotFoundError("Task not found");
      }

      // Member can only change status
      if (!dto.status) {
        throw new NotFoundError("Task not found");
      }

      const memberUpdate: UpdateTaskDto = {
        status: dto.status,
      };

      const task = await this.taskRepository.update(id, memberUpdate);

      if (!task) {
        throw new NotFoundError("Task not found");
      }

      await this.taskHistoryService.createHistory({
        task: task._id.toString(),
        action: "STATUS_CHANGED",
        oldValue: existingTask.status,
        newValue: task.status,
        performedBy: userId,
      });

      if (task.assignedTo && this.getUserId(task.assignedTo) !== userId) {
        await this.notificationService.notifyTaskStatusChanged({
          recipient: this.getUserId(task.assignedTo),
          sender: userId,
          taskId: task._id.toString(),
          taskTitle: task.title,
          status: task.status,
        });
      }

      await this.activityService.createActivity({
        project: this.getProjectId(task),
        user: userId,
        action: ACTIVITY_ACTIONS.TASK_STATUS_CHANGED,
        entityType: ENTITY_TYPES.TASK,
        entityId: task._id.toString(),
        description: `Changed "${task.title}" status to ${task.status}`,
        metadata: {
          status: task.status,
        },
      });

      this.socketService.sendTaskUpdate(this.getProjectId(task), task);

      return task;
    }

    throw new NotFoundError("Task not found");
  }

  // =========================================
  // DELETE TASK
  // =========================================

  async deleteTask(id: string, userId: string) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new NotFoundError("Task not found");
    }

    const projectId = this.getProjectId(existingTask);

    const access = await this.getProjectAccess(projectId, userId);

    if (!this.canManageTasks(access.role)) {
      throw new NotFoundError("Task not found");
    }

    const task = await this.taskRepository.softDelete(id);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.taskHistoryService.createHistory({
      task: id,
      action: "DELETED",
      performedBy: userId,
    });

    await this.activityService.createActivity({
      project: this.getProjectId(task),
      user: userId,
      action: ACTIVITY_ACTIONS.TASK_DELETED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Deleted task "${task.title}"`,
    });

    this.socketService.sendTaskDeleted(
      this.getProjectId(task),
      task._id.toString(),
    );

    return task;
  }

  // =========================================
  // UPDATE TASK STATUS
  // =========================================

  async updateStatus(
    id: string,
    status: UpdateTaskDto["status"],
    userId: string,
  ) {
    if (!status) {
      throw new NotFoundError("Task status is required");
    }

    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new NotFoundError("Task not found");
    }

    const projectId = this.getProjectId(existingTask);

    const access = await this.getProjectAccess(projectId, userId);

    if (!this.canManageTasks(access.role)) {
      throw new NotFoundError("Task not found");
    }

    const task = await this.taskRepository.updateStatus(id, status);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.taskHistoryService.createHistory({
      task: id,
      action: "STATUS_CHANGED",
      newValue: status,
      performedBy: userId,
    });

    if (task.assignedTo && this.getUserId(task.assignedTo) !== userId) {
      await this.notificationService.notifyTaskStatusChanged({
        recipient: this.getUserId(task.assignedTo),
        sender: userId,
        taskId: task._id.toString(),
        taskTitle: task.title,
        status,
      });
    }

    await this.activityService.createActivity({
      project: this.getProjectId(task),
      user: userId,
      action: ACTIVITY_ACTIONS.TASK_STATUS_CHANGED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Changed "${task.title}" status to ${status}`,
      metadata: {
        status,
      },
    });

    this.socketService.sendTaskStatusChanged(this.getProjectId(task), task);

    return task;
  }

  // =========================================
  // ASSIGN TASK
  // =========================================

  async assignTask(id: string, assignedTo: string, userId: string) {
    const existingTask = await this.taskRepository.findById(id);

    if (!existingTask) {
      throw new NotFoundError("Task not found");
    }

    const projectId = this.getProjectId(existingTask);

    const access = await this.getProjectAccess(projectId, userId);

    if (!this.canManageTasks(access.role)) {
      throw new NotFoundError("Task not found");
    }

    const workspaceId = this.getWorkspaceId(access.project);

    await this.validateWorkspaceAssignee(workspaceId, assignedTo);

    const task = await this.taskRepository.assignTask(id, assignedTo);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.taskHistoryService.createHistory({
      task: id,
      action: "ASSIGNED",
      newValue: assignedTo,
      performedBy: userId,
    });

    if (assignedTo !== userId) {
      await this.notificationService.notifyTaskAssigned({
        recipient: assignedTo,
        sender: userId,
        taskId: task._id.toString(),
        taskTitle: task.title,
      });
    }

    await this.activityService.createActivity({
      project: this.getProjectId(task),
      user: userId,
      action: ACTIVITY_ACTIONS.TASK_ASSIGNED,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id.toString(),
      description: `Assigned "${task.title}"`,
      metadata: {
        assignedTo,
      },
    });

    this.socketService.sendTaskAssigned(this.getProjectId(task), task);

    return task;
  }

  // =========================================
  // GET PROJECT ID
  // =========================================

  private getProjectId(task: any): string {
    if (typeof task.project === "string") {
      return task.project;
    }

    if (task.project?._id) {
      return task.project._id.toString();
    }

    return task.project.toString();
  }

  // =========================================
  // GET USER ID
  // =========================================

  private getUserId(user: any): string {
    if (!user) {
      return "";
    }

    if (typeof user === "string") {
      return user;
    }

    if (user._id) {
      return user._id.toString();
    }

    return user.toString();
  }

  // =========================================
  // GET WORKSPACE ID
  // =========================================

  private getWorkspaceId(project: any): string {
    if (!project?.workspace) {
      throw new NotFoundError("Workspace not found");
    }

    if (typeof project.workspace === "object" && "_id" in project.workspace) {
      return String((project.workspace as any)._id);
    }

    return String(project.workspace);
  }

  // =========================================
  // VALIDATE WORKSPACE ASSIGNEE
  // =========================================

  private async validateWorkspaceAssignee(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const [membership, isOwner] = await Promise.all([
      this.membershipRepository.findActiveMembership(workspaceId, userId),

      this.workspaceRepository.isOwner(workspaceId, userId),
    ]);

    if (!membership && !isOwner) {
      throw new NotFoundError("User is not a member of this workspace");
    }
  }

  // =========================================
  // PROJECT ACCESS
  // =========================================

  private async getProjectAccess(projectId: string, userId: string) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const workspaceId = this.getWorkspaceId(project);

    const isWorkspaceOwner = await this.workspaceRepository.isOwner(
      workspaceId,
      userId,
    );

    if (isWorkspaceOwner) {
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

    return {
      project,
      role: membership.role,
    };
  }

  // =========================================
  // TASK PERMISSIONS
  // =========================================

  private canManageTasks(role: MembershipRole): boolean {
    return role === MembershipRole.OWNER || role === MembershipRole.ADMIN;
  }

  private canCreateTasks(role: MembershipRole): boolean {
    return (
      role === MembershipRole.OWNER ||
      role === MembershipRole.ADMIN ||
      role === MembershipRole.MEMBER
    );
  }
}
