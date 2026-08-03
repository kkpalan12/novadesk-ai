import { Request, Response } from "express";

import { WorkspaceService } from "../services/workspace.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class WorkspaceController {
  private readonly workspaceService = new WorkspaceService();

  /**
   * Create Workspace
   */
  createWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const workspace = await this.workspaceService.createWorkspace(
      req.body,
      req.user!.userId,
    );

    res
      .status(201)
      .json(new ApiResponse(true, "Workspace created successfully", workspace));
  });

  /**
   * Get All Workspaces
   */
  getAllWorkspaces = asyncHandler(async (req: Request, res: Response) => {
    const workspaces = await this.workspaceService.getAllWorkspaces(req.query);

    res
      .status(200)
      .json(
        new ApiResponse(true, "Workspaces fetched successfully", workspaces),
      );
  });

  /**
   * Get Workspace By Id
   */
  getWorkspaceById = asyncHandler(async (req: Request, res: Response) => {
    const workspace = await this.workspaceService.getWorkspaceById(
      req.params.id as string,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Workspace fetched successfully", workspace));
  });

  /**
   * Update Workspace
   */
  updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const workspace = await this.workspaceService.updateWorkspace(
      req.params.id as string,
      req.body,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Workspace updated successfully", workspace));
  });

  /**
   * Delete Workspace
   */
  deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
    await this.workspaceService.deleteWorkspace(req.params.id as string);

    res
      .status(200)
      .json(new ApiResponse(true, "Workspace deleted successfully"));
  });

  /**
   * Add Member
   */
  addMember = asyncHandler(async (req: Request, res: Response) => {
    const workspace = await this.workspaceService.addMember(
      req.params.id as string,
      req.body.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Member added successfully", workspace));
  });

  /**
   * Remove Member
   */
  removeMember = asyncHandler(async (req: Request, res: Response) => {
    const workspace = await this.workspaceService.removeMember(
      req.params.id as string,
      req.params.userId as string,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Member removed successfully", workspace));
  });
}
