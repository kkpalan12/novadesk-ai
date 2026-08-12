import { Request, Response } from "express";

import { UserService } from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class UserController {
  private readonly userService = new UserService();

  // =========================================
  // Update My Profile
  // =========================================

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.updateProfile(
      req.user!.userId,
      req.body,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Profile updated successfully", user));
  });
  // =========================================
  // Change Password
  // =========================================

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.changePassword(
      req.user!.userId,
      req.body,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Password changed successfully", result));
  });
}
