import { Router } from "express";

import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import taskRoutes from "./task.routes";
import taskHistoryRoutes from "./task-history.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/tasks", taskRoutes);
router.use("/tasks", taskHistoryRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
