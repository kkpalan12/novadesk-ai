import { Router } from "express";

import { AdminController } from "../controllers/admin.controller";

import { authenticate } from "../middlewares/auth.middleware";

import { authorize } from "../middlewares/auth.middleware";

import { UserRole } from "../constants/roles";

const router = Router();

const adminController = new AdminController();

router.get(
  "/dashboard",

  authenticate,

  authorize(UserRole.ADMIN),

  adminController.dashboard,
);

export default router;
