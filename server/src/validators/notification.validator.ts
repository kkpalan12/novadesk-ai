import { z } from "zod";

import { objectIdSchema } from "./common.validator";

import { NOTIFICATION_TYPES } from "../common/constants/notification.constants";

export const createNotificationSchema = z.object({
  body: z.object({
    recipient: objectIdSchema,

    sender: objectIdSchema,

    type: z.enum(NOTIFICATION_TYPES),

    title: z.string().min(3).max(100),

    message: z.string().min(3).max(500),

    entityType: z.string(),

    entityId: objectIdSchema,
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
