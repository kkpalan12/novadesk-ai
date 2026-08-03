import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(3).max(100),

  description: z.string().optional(),

  logo: z.string().optional(),

  members: z.array(z.string()).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const addMemberSchema = z.object({
  userId: z.string(),
});
