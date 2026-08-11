import { Request, Response } from "express";

import { AttachmentService } from "../services/attachment.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../common/responses/ApiResponse";
import { BadRequestError } from "../common/errors/BadRequestError";

export class AttachmentController {
  private readonly attachmentService = new AttachmentService();

  /**
   * Upload Attachment
   */
  uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError("File is required");
    }

    const attachment = await this.attachmentService.uploadAttachment({
      task: req.params.taskId as string,
      uploadedBy: req.user!.userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: `tasks/${req.file.filename}`,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(true, "Attachment uploaded successfully", attachment),
      );
  });

  /**
   * Get Attachments
   */
  getAttachments = asyncHandler(async (req: Request, res: Response) => {
    const attachments = await this.attachmentService.getAttachments(
      req.params.taskId as string,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(true, "Attachments fetched successfully", attachments),
      );
  });

  /**
   * Delete Attachment
   */
  deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
    await this.attachmentService.deleteAttachment(req.params.id as string);

    return res
      .status(200)
      .json(new ApiResponse(true, "Attachment deleted successfully", null));
  });
}
