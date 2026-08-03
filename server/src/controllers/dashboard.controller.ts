import { Request, Response } from "express";

import { DashboardService } from "../services/dashboard.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class DashboardController {
  private readonly dashboardService = new DashboardService();

  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await this.dashboardService.getDashboard();

    res
      .status(200)
      .json(new ApiResponse(true, "Dashboard fetched successfully", dashboard));
  });
}
