import { Request, Response } from "express";

import { ActivityService } from "../services/activity.service";
import { ApiResponse } from "../common/responses/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export class ActivityController {
  private readonly activityService = new ActivityService();

  /**
   * Get Project Activity Feed
   */
  getProjectActivities = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.activityService.getProjectActivities(
      req.params.projectId as string,
      req.user!.userId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Activities fetched successfully", result));
  });

  /**
   * Get Single Activity
   */
  getActivity = asyncHandler(async (req: Request, res: Response) => {
    const activity = await this.activityService.getActivity(
      req.params.id as string,
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Activity fetched successfully", activity));
  });
}
