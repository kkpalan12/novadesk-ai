import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class AuthController {
  private authService = new AuthService();

  register = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.register(req.body);

    res
      .status(201)
      .json(new ApiResponse(true, "User registered successfully", user));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body);
    const result = await this.authService.login(req.body);

    res.status(200).json(new ApiResponse(true, "Login successful", result));
  });
  profile = asyncHandler(async (req, res) => {
    res
      .status(200)
      .json(new ApiResponse(true, "Profile fetched successfully", req.user));
  });
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await this.authService.refreshToken(refreshToken);

    res.status(200).json(
      new ApiResponse(
        true,

        "Access token refreshed",

        result,
      ),
    );
  });
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    await this.authService.logout(refreshToken);

    res.status(200).json(
      new ApiResponse(
        true,

        "Logout successful",
      ),
    );
  });
}
