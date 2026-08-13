import rateLimit from "express-rate-limit";

import { env } from "../config/env";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  skip: () => env.NODE_ENV === "test",

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});
