import dotenv from "dotenv";
import { z } from "zod";
import { logger } from "../common/logger";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  JWT_EXPIRES_IN: z.string().default("1d"),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  PUBLIC_API_URL: z.string().url(),

  CLIENT_URL: z.string().url().default("http://localhost:4200"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error(
    { issues: parsed.error.format() },
    "Invalid environment variables",
  );

  process.exit(1);
}

export const env = parsed.data;
