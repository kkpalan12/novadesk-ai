import { z } from "zod";

/**
 * MongoDB ObjectId
 */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

/**
 * Pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Search
 */
export const searchSchema = z.string().trim().optional();

/**
 * Boolean Query
 */
export const booleanSchema = z.coerce.boolean().optional();

/**
 * Date
 */
export const dateSchema = z.coerce.date().optional();
