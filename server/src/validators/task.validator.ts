import { z } from "zod";
import { TASK_PRIORITY, TASK_STATUS } from "../common/constants/task.constants";
import { objectIdSchema } from "./common.validator";

export const createTaskSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
  }),

  body: z.object({
    title: z.string().min(3).max(100),

    description: z.string().optional(),

    priority: z.enum(TASK_PRIORITY).optional(),

    assignedTo: z.string().optional(),

    dueDate: z.coerce.date().optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,

    id: z.string().min(1),
  }),

  body: z.object({
    title: z.string().min(3).max(100).optional(),

    description: z.string().optional(),

    priority: z.enum(TASK_PRIORITY).optional(),

    assignedTo: z.string().optional(),

    dueDate: z.coerce.date().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    status: z.enum(TASK_STATUS),
  }),
});

export const assignTaskSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
    id: objectIdSchema,
  }),

  body: z.object({
    assignedTo: objectIdSchema,
  }),
});
