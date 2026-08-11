import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),

    description: z.string().optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    name: z.string().min(3).max(100).optional(),

    description: z.string().optional(),
  }),
});
