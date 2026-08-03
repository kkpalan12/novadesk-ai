import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(3),

  description: z.string().optional(),

  priority: z
    .enum([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ])
    .optional(),

  dueDate: z.string().optional(),

  assignedTo: z.string().optional(),
});