import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.object({
    q: z
      .string()
      .trim()
      .min(1, "Search query is required")
      .max(100, "Search query is too long"),
  }),
});
