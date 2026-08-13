import { z } from "zod";

import { objectIdSchema } from "./common.validator";

export const taskHistorySchema = z.object({
  params: z.object({
    taskId: objectIdSchema,
  }),
});
