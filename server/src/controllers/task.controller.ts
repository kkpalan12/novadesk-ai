import { Request, Response } from "express";

import { TaskService } from "../services/task.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";
import { TaskParams } from "../types/request.types";

export class TaskController {
  private readonly taskService = new TaskService();

  /**
   * Create Task
   */
  createTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.taskService.createTask(req.body, req.user!.userId);

    res
      .status(201)
      .json(new ApiResponse(true, "Task created successfully", task));
  });

  /**
   * Get All Tasks
   */
  getAllTasks = asyncHandler(async (req: Request, res: Response) => {
    const tasks = await this.taskService.getAllTasks(req.query);

    res
      .status(200)
      .json(new ApiResponse(true, "Tasks fetched successfully", tasks));
  });

  /**
   * Get Task By Id
   */
  getTaskById = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.taskService.getTaskById(req.params.id as string);

    res
      .status(200)
      .json(new ApiResponse(true, "Task fetched successfully", task));
  });

  /**
   * Update Task
   */
  updateTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.taskService.updateTask(
      req.params.id as string,

      req.body,

      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Task updated successfully", task));
  });

  /**
   * Delete Task (Soft Delete)
   */
  deleteTask = asyncHandler(async (req: Request, res: Response) => {
    await this.taskService.deleteTask(
      req.params.id as string,
      req.user!.userId,
    );

    res.status(200).json(new ApiResponse(true, "Task deleted successfully"));
  });

  /**
   * Update Task Status
   */
  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.taskService.updateStatus(
      req.params.id as string,
      req.body.status,
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Task status updated successfully", task));
  });

  /**
   * Assign Task
   */
  assignTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.taskService.assignTask(
      req.params.id as string,
      req.body.assignedTo,
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Task assigned successfully", task));
  });
}
