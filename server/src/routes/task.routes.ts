import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createTaskSchema } from "../validators/task.validator";

const router = Router();

const taskController = new TaskController();

router.post(
  "/",
  authenticate,
  validate(createTaskSchema),
  taskController.createTask
);

router.get(
  "/",
  authenticate,
  taskController.getAllTasks
);

router.get(
  "/:id",
  authenticate,
  taskController.getTaskById
);

export default router;