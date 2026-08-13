import { Router } from "express";

import { TaskHistoryController } from "../controllers/task-history.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import { taskHistorySchema } from "../validators/task-history.validator";

const router = Router();

const taskHistoryController = new TaskHistoryController();

router.get(
  "/:taskId/history",
  authenticate,
  validate(taskHistorySchema),
  taskHistoryController.getTaskHistory,
);

export default router;
