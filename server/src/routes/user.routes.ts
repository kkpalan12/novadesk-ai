import { Router } from "express";

import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/user.validator";

const router = Router();

const userController = new UserController();

// =========================================
// Update My Profile
// =========================================

router.put(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  userController.updateProfile,
);
// =========================================
// Change Password
// =========================================

router.put(
  "/me/password",
  authenticate,
  validate(changePasswordSchema),
  userController.changePassword,
);

export default router;
