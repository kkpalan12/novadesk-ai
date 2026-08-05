import { Router } from "express";

import { NotificationController } from "../controllers/notification.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import { notificationIdSchema } from "../validators/notification.validator";

const router = Router();

const controller = new NotificationController();

router.get("/notifications", authenticate, controller.getMyNotifications);

router.patch(
  "/notifications/:id/read",
  authenticate,
  validate(notificationIdSchema),
  controller.markAsRead,
);

router.patch("/notifications/read-all", authenticate, controller.markAllAsRead);

router.delete(
  "/notifications/:id",
  authenticate,
  validate(notificationIdSchema),
  controller.deleteNotification,
);
router.get(
  "/notifications/unread-count",
  authenticate,
  controller.getUnreadCount,
);

export default router;
