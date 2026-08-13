import { z } from "zod";

import { objectIdSchema } from "./common.validator";

export const activityQuerySchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
  }),

  query: z.object({
    page: z.coerce.number().int().min(1).optional(),

    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const activityIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
