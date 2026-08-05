import { z } from "zod";

export const activityQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),

  limit: z.coerce.number().min(1).max(100).optional(),
});
