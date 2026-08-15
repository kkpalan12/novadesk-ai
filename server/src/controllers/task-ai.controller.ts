import { Request, Response } from "express";

import { TaskAiService } from "../services/task-ai.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class TaskAiController {
  private readonly taskAiService = new TaskAiService();

  analyzeTask = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.taskAiService.analyzeTask(
      req.params.id as string,
      req.params.projectId as string,
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Task analyzed successfully", result));
  });
}
