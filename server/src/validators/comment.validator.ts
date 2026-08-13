import { z } from "zod";

import { objectIdSchema } from "./common.validator";

export const createCommentSchema = z.object({
  params: z.object({
    taskId: objectIdSchema,
  }),

  body: z.object({
    content: z.string().min(1).max(2000),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z.object({
    content: z.string().min(1).max(2000),
  }),
});

export const commentIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
