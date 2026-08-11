import { z } from "zod";

import { MembershipRole } from "../interfaces/membership.interface";
import { objectIdSchema } from "./common.validator";

export const createMembershipSchema = z.object({
  body: z.object({
    workspace: objectIdSchema,

    user: objectIdSchema,

    role: z.nativeEnum(MembershipRole).optional(),
  }),
});

export const updateMembershipSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    role: z.nativeEnum(MembershipRole),
  }),
});
