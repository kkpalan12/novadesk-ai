import { Request, Response } from "express";

import { ProjectService } from "../services/project.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class ProjectController {
  private readonly projectService = new ProjectService();

  /**
   * Create Project
   */
  createProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await this.projectService.createProject(
      req.body,
      req.user!.userId,
    );

    res
      .status(201)
      .json(new ApiResponse(true, "Project created successfully", project));
  });

  /**
   * Get All Projects
   */
  getAllProjects = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.projectService.getAllProjects(
      req.query,
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Projects fetched successfully", result));
  });
  /**
   * Get Project By Id
   */
  getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const project = await this.projectService.getProjectById(
      req.params.id as string,
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Project fetched successfully", project));
  });
  /**
   * Update Project
   */
  updateProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await this.projectService.updateProject(
      req.params.id as string,
      req.body,
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Project updated successfully", project));
  });

  /**
   * Delete Project
   */
  deleteProject = asyncHandler(async (req: Request, res: Response) => {
    await this.projectService.deleteProject(
      req.params.id as string,
      req.user!.userId,
    );

    res.status(200).json(new ApiResponse(true, "Project deleted successfully"));
  });
}
