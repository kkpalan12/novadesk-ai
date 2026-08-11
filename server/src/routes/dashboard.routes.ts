import { Router } from "express";

import { DashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

const controller = new DashboardController();

router.get("/dashboard", authenticate, controller.getDashboard);

export default router;
