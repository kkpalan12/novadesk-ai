import { Router } from "express";

import { DashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

const dashboardController = new DashboardController();

/**
 * Dashboard Statistics
 */
router.get("/", authenticate, dashboardController.getDashboard);

export default router;
