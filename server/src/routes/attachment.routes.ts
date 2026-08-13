import { Router } from "express";

import { AttachmentController } from "../controllers/attachment.controller";

import { authenticate } from "../middlewares/auth.middleware";

import { upload } from "../middlewares/multer.middleware";

const router = Router();

const attachmentController = new AttachmentController();

/**
 * Upload Attachment
 */
router.post(
  "/tasks/:taskId/attachments",
  authenticate,
  upload.single("file"),
  attachmentController.uploadAttachment,
);

/**
 * Get Task Attachments
 */
router.get(
  "/tasks/:taskId/attachments",
  authenticate,
  attachmentController.getAttachments,
);

/**
 * Delete Attachment
 */
router.delete(
  "/attachments/:id",
  authenticate,
  attachmentController.deleteAttachment,
);

/**
 * Attachment Route Test
 *
 * Temporary development endpoint.
 */
router.get("/attachment-test", (_req, res) => {
  res.send("Attachment Route Working");
});

export default router;
