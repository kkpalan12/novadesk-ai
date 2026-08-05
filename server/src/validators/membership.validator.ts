import { z } from "zod";
import { UserRole } from "../common/constants/roles";
import { objectIdSchema } from "./common.validator";

export const createMembershipSchema = z.object({
  body: z.object({
    workspace: objectIdSchema,

    user: objectIdSchema,

    role: z.nativeEnum(UserRole),
  }),
});

export const updateMembershipSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    role: z.nativeEnum(UserRole),
  }),
});
