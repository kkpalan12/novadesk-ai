import { z } from "zod";
import { objectIdSchema } from "./common.validator";

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),

    description: z.string().optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z.object({
    name: z.string().min(3).max(100).optional(),

    description: z.string().optional(),
  }),
});

export const workspaceIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
