import { z } from "zod";

export const createProjectSchema = z.object({
  workspace: z.string().min(1),

  name: z.string().min(3).max(100),

  description: z.string().optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).max(100).optional(),

  description: z.string().optional(),

  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});
