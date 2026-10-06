import { z } from "zod";

const plannedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(20),
  repMin: z.number().int().min(0).max(999),
  repMax: z.number().int().min(0).max(999),
  targetWeight: z.number().min(0).max(500).nullable(),
  restSec: z.number().int().min(0).max(600),
  notes: z.string().max(500).default(""),
  sortOrder: z.number().int().min(0).optional(),
});

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  category: z.enum(["push", "pull", "legs", "upper", "lower", "full", "custom"]),
  exercises: z.array(plannedExerciseSchema).max(30),
  notes: z.string().max(1000).default(""),
  scheduledDays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
});

export const updatePlanSchema = createPlanSchema.partial();

export const planParamsSchema = z.object({
  id: z.string().min(1),
});
