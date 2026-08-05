import { z } from "zod";
import { objectIdSchema } from "./common.validator";

export const createCommentSchema = z.object({
  params: z.object({
    taskId: objectIdSchema,
  }),

  body: z.object({
    content: z.string().min(1).max(1000),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    content: z.string().min(1).max(1000),
  }),
});
