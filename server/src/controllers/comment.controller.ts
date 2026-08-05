import { Request, Response } from "express";

import { CommentService } from "../services/comment.service";

import { ApiResponse } from "../common/responses/ApiResponse";

import { asyncHandler } from "../utils/asyncHandler";

export class CommentController {
  private readonly service = new CommentService();

  createComment = asyncHandler(async (req: Request, res: Response) => {
    const comment = await this.service.createComment({
      task: req.params.taskId as string,

      content: req.body.content,

      createdBy: req.user!.userId,
    });

    return res.status(201).json(
      new ApiResponse(
        true,

        "Comment created successfully",

        comment,
      ),
    );
  });

  getComments = asyncHandler(async (req: Request, res: Response) => {
    const comments = await this.service.getComments(
      req.params.taskId as string,
    );

    return res.json(
      new ApiResponse(true, "Comments fetched successfully", comments),
    );
  });

  updateComment = asyncHandler(async (req: Request, res: Response) => {
    const comment = await this.service.updateComment(
      req.params.id as string,

      req.body,

      req.user!.userId,
    );

    return res.status(200).json(
      new ApiResponse(
        true,

        "Comment updated successfully",

        comment,
      ),
    );
  });

  deleteComment = asyncHandler(async (req: Request, res: Response) => {
    await this.service.deleteComment(
      req.params.id as string,

      req.user!.userId,
    );

    return res.status(200).json(
      new ApiResponse(
        true,

        "Comment deleted successfully",
      ),
    );
  });
}
