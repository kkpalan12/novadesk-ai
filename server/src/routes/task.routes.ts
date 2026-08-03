import { Router } from "express";

import { TaskController } from "../controllers/task.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import { UserRole } from "../common/constants/roles";

import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  assignTaskSchema,
} from "../validators/task.validator";

const router = Router();

const taskController = new TaskController();

/**
 * Create Task
 */
router.post(
  "/",
  authenticate,
  validate(createTaskSchema),
  taskController.createTask,
);

/**
 * Get All Tasks
 */
router.get("/", authenticate, taskController.getAllTasks);

/**
 * Get Task By Id
 */
router.get("/:id", authenticate, taskController.getTaskById);

/**
 * Update Task
 */
router.put(
  "/:id",
  authenticate,
  validate(updateTaskSchema),
  taskController.updateTask,
);

/**
 * Soft Delete Task
 */
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  taskController.deleteTask,
);

/**
 * Change Task Status
 */
router.patch(
  "/:id/status",
  authenticate,
  validate(updateStatusSchema),
  taskController.updateStatus,
);

/**
 * Assign Task
 */
router.patch(
  "/:id/assign",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(assignTaskSchema),
  taskController.assignTask,
);

export default router;
