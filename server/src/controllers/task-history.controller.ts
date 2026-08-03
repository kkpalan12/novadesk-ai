import { Request, Response } from "express";

import { TaskHistoryService } from "../services/task-history.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class TaskHistoryController {
  private readonly taskHistoryService = new TaskHistoryService();

  /**
   * Get History
   */
  getTaskHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await this.taskHistoryService.getTaskHistory(
      String(req.params.id),
    );

    res
      .status(200)
      .json(
        new ApiResponse(true, "Task history fetched successfully", history),
      );
  });
}
