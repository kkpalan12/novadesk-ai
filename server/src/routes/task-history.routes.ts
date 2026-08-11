import { Router } from "express";

import { TaskHistoryController } from "../controllers/task-history.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

const taskHistoryController = new TaskHistoryController();

router.get(
  "/:taskId/history",
  authenticate,
  taskHistoryController.getTaskHistory,
);

export default router;
