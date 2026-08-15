import { Router } from "express";

import { TaskAiController } from "../controllers/task-ai.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import { taskIdSchema } from "../validators/task.validator";

const router = Router();

const taskAiController = new TaskAiController();

router.post(
  "/projects/:projectId/tasks/:id/ai/analyze",
  authenticate,
  validate(taskIdSchema),
  taskAiController.analyzeTask,
);

export default router;
