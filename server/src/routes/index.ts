import { Router } from "express";

import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import taskRoutes from "./task.routes";
import taskHistoryRoutes from "./task-history.routes";
import dashboardRoutes from "./dashboard.routes";
import workspaceRoutes from "./workspace.routes";
import membershipRoutes from "./membership.routes";
import projectRoutes from "./project.routes";
import attachmentRoutes from "./attachment.routes";
import commentRoutes from "./comment.routes";
import notificationRoutes from "./notification.routes";
import activityRoutes from "./activity.routes";

const router = Router();
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/", taskRoutes);
router.use("/tasks", taskHistoryRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/memberships", membershipRoutes);
router.use("/projects", projectRoutes);
router.use("/", attachmentRoutes);
router.use("/", commentRoutes);
router.use("/", notificationRoutes);
router.use("/", activityRoutes);

export default router;
