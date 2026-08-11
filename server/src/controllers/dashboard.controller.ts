import { Request, Response } from "express";

import { DashboardService } from "../services/dashboard.service";

import { ApiResponse } from "../common/responses/ApiResponse";

import { asyncHandler } from "../utils/asyncHandler";

export class DashboardController {
  private readonly dashboardService = new DashboardService();

  /**
   * Get Dashboard
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await this.dashboardService.getDashboard(
      req.user!.userId,
    );

    return res
      .status(200)
      .json(new ApiResponse(true, "Dashboard fetched successfully", dashboard));
  });
}
