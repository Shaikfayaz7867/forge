import { z } from "zod";

const loggedSetSchema = z.object({
  id: z.string().optional(),
  weight: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(999),
  completed: z.boolean().default(true),
});

const loggedExerciseSchema = z.object({
  id: z.string().optional(),
  exerciseId: z.string().min(1),
  sets: z.array(loggedSetSchema).max(30),
  notes: z.string().max(500).default(""),
  restSec: z.number().int().min(0).max(600).default(90),
});

export const startSessionSchema = z.object({
  planId: z.string().nullable().optional(),
  name: z.string().trim().min(1).max(100).default("Quick Workout"),
  category: z.enum(["push", "pull", "legs", "upper", "lower", "full", "custom"]).default("custom"),
  exercises: z.array(loggedExerciseSchema).max(30).default([]),
});

export const updateActiveSessionSchema = z.object({
  name: z.string().trim().max(100).optional(),
  notes: z.string().max(1000).optional(),
  currentExerciseIndex: z.number().int().min(0).optional(),
  exercises: z.array(loggedExerciseSchema).max(30).optional(),
});

export const completeSessionSchema = z.object({
  notes: z.string().max(1000).optional(),
  exercises: z.array(loggedExerciseSchema).max(30).optional(),
});

export const sessionParamsSchema = z.object({
  id: z.string().min(1),
});

export const historyQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  exerciseId: z.string().optional(),
  category: z.enum(["push", "pull", "legs", "upper", "lower", "full", "custom"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
