import { Router } from "express";

import { ProjectController } from "../controllers/project.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator";
const router = Router();

const projectController = new ProjectController();

/**
 * Create Project
 */
router.post(
  "/",
  authenticate,
  validate(createProjectSchema),
  projectController.createProject,
);

/**
 * Get All Projects
 */
router.get("/", authenticate, projectController.getAllProjects);

/**
 * Get Project By Id
 */
router.get("/:id", authenticate, projectController.getProjectById);

/**
 * Update Project
 */
router.put(
  "/:id",
  authenticate,
  validate(updateProjectSchema),
  projectController.updateProject,
);

/**
 * Delete Project
 */
router.delete("/:id", authenticate, projectController.deleteProject);

export default router;
