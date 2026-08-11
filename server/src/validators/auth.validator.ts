import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2, "First name is required"),

    lastName: z.string().trim().min(2, "Last name is required"),

    email: z.string().email("Invalid email").toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number and special character",
      ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),

    password: z.string().min(1),
  }),
});
