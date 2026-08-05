import { Request, Response } from "express";

import { TaskService } from "../services/task.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class TaskController {
  private readonly taskService = new TaskService();

  /**
   * Create Task
   */
  createTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.taskService.createTask(
      {
        ...req.body,
        project: req.params.projectId,
      },
      req.user!.userId,
    );

    res
      .status(201)
      .json(new ApiResponse(true, "Task created successfully", task));
  });

  /**
   * Get All Tasks
   */
  getAllTasks = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.taskService.getAllTasks({
      ...req.query,
      project: req.params.projectId,
    });

    res
      .status(200)
      .json(new ApiResponse(true, "Tasks fetched successfully", result));
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
   * Delete Task
   */
  deleteTask = asyncHandler(async (req: Request, res: Response) => {
    await this.taskService.deleteTask(
      req.params.id as string,
      req.user!.userId,
    );

    res.status(200).json(new ApiResponse(true, "Task deleted successfully"));
  });
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
