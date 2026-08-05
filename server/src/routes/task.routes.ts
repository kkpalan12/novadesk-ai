import { Router } from "express";

import { TaskController } from "../controllers/task.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import {
  assignTaskSchema,
  createTaskSchema,
  updateTaskSchema,
} from "../validators/task.validator";

const router = Router();

const taskController = new TaskController();

/**
 * Project Tasks
 */

router.post(
  "/projects/:projectId/tasks",
  authenticate,
  validate(createTaskSchema),
  taskController.createTask,
);

router.get(
  "/projects/:projectId/tasks",
  authenticate,
  taskController.getAllTasks,
);

router.get(
  "/projects/:projectId/tasks/:id",
  authenticate,
  taskController.getTaskById,
);

router.put(
  "/projects/:projectId/tasks/:id",
  authenticate,
  validate(updateTaskSchema),
  taskController.updateTask,
);

router.delete(
  "/projects/:projectId/tasks/:id",
  authenticate,
  taskController.deleteTask,
);

router.patch(
  "/projects/:projectId/tasks/:id/assign",
  authenticate,
  validate(assignTaskSchema),
  taskController.assignTask,
);
export default router;
