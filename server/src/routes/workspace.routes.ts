import { Router } from "express";

import { WorkspaceController } from "../controllers/workspace.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "../validators/workspace.validator";

const router = Router();

const workspaceController = new WorkspaceController();

/**
 * @swagger
 * tags:
 *   name: Workspace
 *   description: Workspace management APIs
 */

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspace]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: NovaDesk AI
 *               description:
 *                 type: string
 *                 example: Workspace for managing AI projects
 *     responses:
 *       201:
 *         description: Workspace created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authenticate,
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace,
);

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: Get all workspaces of the logged-in user
 *     tags: [Workspace]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, workspaceController.getAllWorkspaces);

/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Get workspace by ID
 *     tags: [Workspace]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace fetched successfully
 *       404:
 *         description: Workspace not found
 */
router.get("/:id", authenticate, workspaceController.getWorkspaceById);

/**
 * @swagger
 * /workspaces/{id}:
 *   put:
 *     summary: Update workspace
 *     tags: [Workspace]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: NovaDesk AI Updated
 *               description:
 *                 type: string
 *                 example: Updated workspace description
 *     responses:
 *       200:
 *         description: Workspace updated successfully
 *       404:
 *         description: Workspace not found
 */
router.put(
  "/:id",
  authenticate,
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace,
);

/**
 * @swagger
 * /workspaces/{id}:
 *   delete:
 *     summary: Delete workspace
 *     tags: [Workspace]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace deleted successfully
 *       404:
 *         description: Workspace not found
 */
router.delete("/:id", authenticate, workspaceController.deleteWorkspace);

export default router;
