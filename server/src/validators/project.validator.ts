import { z } from "zod";
import { PROJECT_STATUS } from "../common/constants/project.constants";

export const createProjectSchema = z.object({
  body: z.object({
    workspace: z.string().min(1),

    name: z.string().min(3).max(100),

    description: z.string().optional(),

    status: z.enum(PROJECT_STATUS).optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    name: z.string().min(3).max(100).optional(),

    description: z.string().optional(),

    status: z.enum(PROJECT_STATUS).optional(),
  }),
});
