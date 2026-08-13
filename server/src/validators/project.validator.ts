import { z } from "zod";

import { PROJECT_STATUS } from "../common/constants/project.constants";
import { objectIdSchema, paginationSchema } from "./common.validator";

export const createProjectSchema = z.object({
  body: z.object({
    workspace: objectIdSchema,

    name: z.string().min(3).max(100),

    description: z.string().optional(),

    status: z.enum(PROJECT_STATUS).optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z.object({
    name: z.string().min(3).max(100).optional(),

    description: z.string().optional(),

    status: z.enum(PROJECT_STATUS).optional(),
  }),
});

export const projectQuerySchema = z.object({
  query: paginationSchema.extend({
    search: z.string().trim().max(100, "Search query is too long").optional(),

    workspace: objectIdSchema.optional(),

    status: z.enum(PROJECT_STATUS).optional(),
  }),
});
