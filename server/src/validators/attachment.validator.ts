import { z } from "zod";
import { objectIdSchema } from "./common.validator";

export const attachmentSchema = z.object({
  params: z.object({
    taskId: objectIdSchema,
  }),
});
