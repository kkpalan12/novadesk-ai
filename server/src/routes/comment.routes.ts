import { Router } from "express";

import { CommentController } from "../controllers/comment.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import {
  commentIdSchema,
  createCommentSchema,
  updateCommentSchema,
} from "../validators/comment.validator";

const router = Router();

const controller = new CommentController();

/**
 * Create Comment
 */
router.post(
  "/tasks/:taskId/comments",
  authenticate,
  validate(createCommentSchema),
  controller.createComment,
);

/**
 * Get Comments
 */
router.get(
  "/tasks/:taskId/comments",
  authenticate,
  validate(createCommentSchema.pick({ params: true })),
  controller.getComments,
);

/**
 * Update Comment
 */
router.put(
  "/comments/:id",
  authenticate,
  validate(updateCommentSchema),
  controller.updateComment,
);

/**
 * Delete Comment
 */
router.delete(
  "/comments/:id",
  authenticate,
  validate(commentIdSchema),
  controller.deleteComment,
);

export default router;
