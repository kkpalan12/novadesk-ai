import { z } from "zod";

import { TASK_PRIORITY, TASK_STATUS } from "../common/constants/task.constants";

import { objectIdSchema, paginationSchema } from "./common.validator";

export const createTaskSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
  }),

  body: z.object({
    title: z.string().min(3).max(100),

    description: z.string().optional(),

    priority: z.enum(TASK_PRIORITY).optional(),

    assignedTo: objectIdSchema.optional(),

    dueDate: z.coerce.date().optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,

    id: objectIdSchema,
  }),

  body: z.object({
    title: z.string().min(3).max(100).optional(),

    description: z.string().optional(),

    priority: z.enum(TASK_PRIORITY).optional(),

    assignedTo: objectIdSchema.optional(),

    dueDate: z.coerce.date().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
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

export const taskQuerySchema = z.object({
  query: paginationSchema.extend({
    search: z.string().trim().max(100, "Search query is too long").optional(),

    status: z.enum(TASK_STATUS).optional(),

    priority: z.enum(TASK_PRIORITY).optional(),

    sort: z.string().trim().max(50, "Sort field is too long").optional(),
  }),
});
export const taskIdSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
    id: objectIdSchema,
  }),
});
