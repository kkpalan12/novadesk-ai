import { Router } from "express";

import { ActivityController } from "../controllers/activity.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import { activityQuerySchema } from "../validators/activity.validator";

const router = Router();

const controller = new ActivityController();

/**
 * @swagger
 * /projects/{projectId}/activity:
 *   get:
 *     summary: Get project activity feed
 *     tags:
 *       - Activity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activities fetched successfully
 */
router.get(
  "/projects/:projectId/activity",
  authenticate,
  validate(activityQuerySchema),
  controller.getProjectActivities,
);
router.get("/activities/:id", authenticate, controller.getActivity);
export default router;
