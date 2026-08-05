import { Request, Response } from "express";

import { ApiResponse } from "../common/responses/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

import { NotificationService } from "../services/notification.service";

export class NotificationController {
  private readonly notificationService = new NotificationService();

  /**
   * Get logged-in user's notifications
   */
  getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await this.notificationService.getMyNotifications(
      req.user!.userId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          true,
          "Notifications fetched successfully",
          notifications,
        ),
      );
  });

  /**
   * Mark a notification as read
   */
  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await this.notificationService.markAsRead(
      req.params.id as string,
      req.user!.userId as string,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Notification marked as read", notification));
  });

  /**
   * Mark all notifications as read
   */
  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.notificationService.markAllAsRead(
      req.user!.userId,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "All notifications marked as read", result));
  });

  /**
   * Delete notification (Soft Delete)
   */
  deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    await this.notificationService.delete(
      req.params.id as string,
      req.user!.userId as string,
    );

    res
      .status(200)
      .json(new ApiResponse(true, "Notification deleted successfully"));
  });
  /**
   * Get unread notification count
   */
  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.notificationService.getUnreadCount(
      req.user!.userId,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          true,
          "Unread notification count fetched successfully",
          result,
        ),
      );
  });
}
