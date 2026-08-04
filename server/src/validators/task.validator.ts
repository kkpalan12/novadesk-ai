import { z } from "zod";

export const createTaskSchema = z.object({
  project: z.string().min(1),

  title: z.string().min(3).max(100),

  description: z.string().optional(),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),

  assignedTo: z.string().optional(),

  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export const assignTaskSchema = z.object({
  assignedTo: z.string().min(1),
});
