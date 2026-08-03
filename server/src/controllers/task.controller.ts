import { Request, Response } from "express";
import { TaskService } from "../services/task.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";
import { CreateTaskDto } from "../dto/task/create-task.dto";

interface TaskParams {
  id: string;
}

export class TaskController {
  private readonly taskService = new TaskService();

  /**
   * Create Task
   */
  createTask = asyncHandler(
    async (req: Request<{}, {}, CreateTaskDto>, res: Response) => {
      const task = await this.taskService.createTask(
        req.body,
        req.user!.userId
      );

      res.status(201).json(
        new ApiResponse(
          true,
          "Task created successfully",
          task
        )
      );
    }
  );

  /**
   * Get All Tasks
   */
  getAllTasks = asyncHandler(
    async (req: Request, res: Response) => {
      const tasks = await this.taskService.getAllTasks();

      res.status(200).json(
        new ApiResponse(
          true,
          "Tasks fetched successfully",
          tasks
        )
      );
    }
  );

  /**
   * Get Task By Id
   */
getTaskById = asyncHandler(
    async (req: Request, res: Response) => {

        const task = await this.taskService.getTaskById(
            String(req.params.id)
        );

        res.status(200).json(
            new ApiResponse(
                true,
                "Task fetched successfully",
                task
            )
        );
    }
);
}