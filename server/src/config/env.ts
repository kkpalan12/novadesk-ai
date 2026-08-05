import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(5000),

  MONGO_URI: z.string().min(1),

  JWT_SECRET: z.string().min(8),

  JWT_REFRESH_SECRET: z.string().min(8),
});

export const env = envSchema.parse(process.env);
