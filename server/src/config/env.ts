import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

console.log("Loaded ENV:", process.env.MONGO_URI);

const envSchema = z.object({
  PORT: z.string().default("5000"),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);