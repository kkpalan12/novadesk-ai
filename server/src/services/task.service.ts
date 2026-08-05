import { TaskRepository } from "../repositories/task.repository";
import { TaskMapper } from "../mappers/task.mapper";

import { CreateTaskDto } from "../dto/task/create-task.dto";
import { UpdateTaskDto } from "../dto/task/update-task.dto";

import { NotFoundError } from "../common/errors/NotFoundError";
import { TaskHistoryService } from "./task-history.service";
import { ProjectRepository } from "../repositories/project.repository";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../common/constants/constants";
import { NotificationService } from "./notification.service";
import { ENTITY_TYPES } from "../common/constants/entity.constants";

export class TaskService {
  private readonly taskRepository = new TaskRepository();
  private readonly taskHistoryService = new TaskHistoryService();
  private readonly projectRepository = new ProjectRepository();
  private readonly notificationService = new NotificationService();

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

    return task;
  }

  /**
   * Soft Delete Task
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

    return task;
  }

  /**
   * Change Status
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

    return task;
  }

  /**
   * Assign User
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

    // Don't notify if the user assigns the task to themselves
    if (assignedTo !== userId) {
      await this.notificationService.create({
        recipient: assignedTo,
        sender: userId,
        type: "TASK_ASSIGNED",
        title: "Task Assigned",
        message: `You have been assigned the task "${task.title}".`,
        entityType: ENTITY_TYPES.TASK,
        entityId: task._id.toString(),
      });
    }

    return task;
  }
}
