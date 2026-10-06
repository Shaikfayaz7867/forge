import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  name: z.string().trim().min(1, "Name is required").max(40, "Name too long"),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});
