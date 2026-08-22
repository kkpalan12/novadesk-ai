import { Request, Response } from "express";
import { z } from "zod";

import { AiService } from "../services/ai.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";
import { BadRequestError } from "../common/errors/BadRequestError";

const aiChatSchema = z.object({
  message: z.string().trim().min(1).max(4000),

  workspaceId: z.string().trim().min(1),

  projectId: z.string().trim().min(1).optional(),
});

export class AiController {
  private readonly aiService = new AiService();

  chat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // ==========================================================
    // VALIDATE REQUEST
    // ==========================================================

    const validation = aiChatSchema.safeParse(req.body);

    if (!validation.success) {
      throw new BadRequestError("A valid message and workspaceId are required");
    }

    const { message, workspaceId, projectId } = validation.data;

    // ==========================================================
    // LOG CONTEXT
    // ==========================================================

    console.log("NovaDesk AI Controller:", {
      message,
      workspaceId,
      projectId,
      userId: req.user?.userId,
    });

    // ==========================================================
    // USER VALIDATION
    // ==========================================================

    if (!req.user?.userId) {
      throw new BadRequestError("Authenticated user is required");
    }

    // ==========================================================
    // AI SERVICE
    // ==========================================================

    const result = await this.aiService.chat(
      message,
      workspaceId,
      req.user.userId,
      projectId,
    );

    // ==========================================================
    // EXPLICIT API RESPONSE
    // ==========================================================

    const data = {
      message: result.message,

      ...(result.metrics
        ? {
            metrics: result.metrics,
          }
        : {}),

      ...(result.project
        ? {
            project: result.project,
          }
        : {}),

      ...(result.focusTasks
        ? {
            focusTasks: result.focusTasks,
          }
        : {}),
    };

    // ==========================================================
    // RESPONSE
    // ==========================================================

    res
      .status(200)
      .json(new ApiResponse(true, "AI response generated successfully", data));
  });
}
