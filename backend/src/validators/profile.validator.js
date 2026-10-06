import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(40, "Name too long"),
  age: z.number().int().min(13, "Must be at least 13").max(100, "Invalid age"),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.number().min(120, "Height too low").max(230, "Height too high"),
  weightKg: z.number().min(30, "Weight too low").max(250, "Weight too high"),
  goal: z.enum(["build_muscle", "gain_weight", "lose_fat", "maintain", "strength", "general"]),
  activity: z.enum(["sedentary", "light", "moderate", "very"]),
  trainingDays: z.union([
    z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6),
  ]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  calorieOverride: z.number().min(1000).max(6000).nullable(),
});

export const profilePatchSchema = profileSchema.partial();
