import { Router } from "express";

import { TaskHistoryController } from "../controllers/task-history.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

const taskHistoryController = new TaskHistoryController();

/**
 * GET /api/v1/tasks/:id/history
 */
router.get("/:id/history", authenticate, taskHistoryController.getTaskHistory);

export default router;
