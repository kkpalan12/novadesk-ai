import { z } from "zod";

export const createMembershipSchema = z.object({
  workspace: z.string().min(1),

  user: z.string().min(1),

  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
});

export const updateMembershipSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),

  status: z.enum(["ACTIVE", "INVITED", "REMOVED"]).optional(),
});
