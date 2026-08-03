import { Router } from "express";

import { WorkspaceController } from "../controllers/workspace.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
} from "../validators/workspace.validator";

const router = Router();

const workspaceController = new WorkspaceController();

/**
 * Create Workspace
 */
router.post(
  "/",
  authenticate,
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace,
);

/**
 * Get All Workspaces
 */
router.get("/", authenticate, workspaceController.getAllWorkspaces);

/**
 * Get Workspace By Id
 */
router.get("/:id", authenticate, workspaceController.getWorkspaceById);

/**
 * Update Workspace
 */
router.put(
  "/:id",
  authenticate,
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace,
);

/**
 * Delete Workspace
 */
router.delete("/:id", authenticate, workspaceController.deleteWorkspace);

/**
 * Add Member
 */
router.post(
  "/:id/members",
  authenticate,
  validate(addMemberSchema),
  workspaceController.addMember,
);

/**
 * Remove Member
 */
router.delete(
  "/:id/members/:userId",
  authenticate,
  workspaceController.removeMember,
);

export default router;
