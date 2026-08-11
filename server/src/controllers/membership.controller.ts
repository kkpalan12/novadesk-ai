import { Request, Response } from "express";

import { MembershipService } from "../services/membership.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";

export class MembershipController {
  private readonly membershipService = new MembershipService();

  /**
   * Add Member
   */
  createMembership = asyncHandler(async (req: Request, res: Response) => {
    const membership = await this.membershipService.createMembership(
      req.body,
      req.user!.userId,
    );

    res
      .status(201)
      .json(new ApiResponse(true, "Member added successfully", membership));
  });

  /**
   * Get Workspace Members
   */
  getWorkspaceMembers = asyncHandler(async (req: Request, res: Response) => {
    const members = await this.membershipService.getWorkspaceMembers(
      req.params.workspaceId as string,
      req.user!.userId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          true,
          "Workspace members fetched successfully",
          members,
        ),
      );
  });

  /**
   * Update Membership
   */
  updateMembership = asyncHandler(async (req: Request, res: Response) => {
    const membership = await this.membershipService.updateMembership(
      req.params.id as string,
      req.body,
      req.user!.userId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(true, "Membership updated successfully", membership),
      );
  });

  /**
   * Remove Member
   */
  removeMembership = asyncHandler(async (req: Request, res: Response) => {
    await this.membershipService.removeMembership(
      req.params.id as string,
      req.user!.userId,
    );

    res.status(200).json(new ApiResponse(true, "Member removed successfully"));
  });
}
