import { Router } from "express";

import { MembershipController } from "../controllers/membership.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";

import { UserRole } from "../common/constants/roles";

import {
  createMembershipSchema,
  updateMembershipSchema,
} from "../validators/membership.validator";

const router = Router();

const membershipController = new MembershipController();

/**
 * Add Member
 */
router.post(
  "/",
  authenticate,
  validate(createMembershipSchema),
  membershipController.createMembership,
);
/**
 * Get Workspace Members
 */
router.get(
  "/workspace/:workspaceId",
  authenticate,
  membershipController.getWorkspaceMembers,
);

/**
 * Update Member
 */
router.put(
  "/:id",
  authenticate,
  validate(updateMembershipSchema),
  membershipController.updateMembership,
);

/**
 * Remove Member
 */
router.delete("/:id", authenticate, membershipController.removeMembership);

export default router;
