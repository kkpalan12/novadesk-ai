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

export class TaskService {
  private readonly taskRepository = new TaskRepository();

  private readonly projectRepository = new ProjectRepository();

  private readonly taskHistoryService = new TaskHistoryService();

  private readonly notificationService = new NotificationService();

  private readonly activityService = new ActivityService();

  private readonly socketService = new SocketService();

  /**
   * Create Task
   */
  async createTask(dto: CreateTaskDto, createdBy: string) {
    const project = await this.projectRepository.findById(dto.project);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const entity = TaskMapper.toEntity(dto, createdBy);

    const task = await this.taskRepository.create(entity);

    await this.activityService.createActivity({
      project: dto.project,
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

    this.socketService.sendTaskUpdate(dto.project, task);

    return task;
  }

  /**
   * Get All Tasks
   */
  async getAllTasks(query: any) {
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

  /**
   * Get Task By Id
   */
  async getTaskById(id: string) {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return task;
  }

  /**
   * Update Task
   */
  async updateTask(id: string, dto: UpdateTaskDto, userId: string) {
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
  } /**
   * Delete Task
   */
  async deleteTask(id: string, userId: string) {
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

  /**
   * Update Task Status
   */
  async updateStatus(
    id: string,
    status: UpdateTaskDto["status"],
    userId: string,
  ) {
    const task = await this.taskRepository.updateStatus(id, status!);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.taskHistoryService.createHistory({
      task: id,
      action: "STATUS_CHANGED",
      newValue: status,
      performedBy: userId,
    });

    if (task.assignedTo && task.assignedTo.toString() !== userId) {
      await this.notificationService.notifyTaskStatusChanged({
        recipient: task.assignedTo.toString(),
        sender: userId,
        taskId: task._id.toString(),
        taskTitle: task.title,
        status: status!,
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

    this.socketService.sendTaskUpdate(this.getProjectId(task), task);

    return task;
  }

  /**
   * Assign Task
   */
  async assignTask(id: string, assignedTo: string, userId: string) {
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

    this.socketService.sendTaskUpdate(this.getProjectId(task), task);

    return task;
  }

  /**
   * Helper
   * Returns project id whether populated or not
   */
  private getProjectId(task: any): string {
    if (typeof task.project === "string") {
      return task.project;
    }

    if (task.project?._id) {
      return task.project._id.toString();
    }

    return task.project.toString();
  }
}
