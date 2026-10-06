import { z } from "zod";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(40, "Keep it under 40 characters"),
  age: z.number({ error: "Enter your age" }).int("Whole years only").min(13, "Forge is for ages 13+").max(100, "Enter a valid age"),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.number({ error: "Enter your height" }).min(120, "Height looks too low").max(230, "Height looks too high"),
  weightKg: z.number({ error: "Enter your weight" }).min(30, "Weight looks too low").max(250, "Weight looks too high"),
  goal: z.enum(["build_muscle", "gain_weight", "lose_fat", "maintain", "strength", "general"]),
  activity: z.enum(["sedentary", "light", "moderate", "very"]),
  trainingDays: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  calorieOverride: z.number().min(1000).max(6000).nullable(),
  createdAt: z.string(),
});

const loggedSet = z.object({ id: z.string(), weight: z.number().min(0), reps: z.number().min(0), completed: z.boolean() });
const loggedExercise = z.object({
  id: z.string(),
  exerciseId: z.string(),
  sets: z.array(loggedSet),
  notes: z.string().default(""),
  restSec: z.number().default(90),
});

const session = z.object({
  id: z.string(),
  planId: z.string().nullable(),
  name: z.string(),
  category: z.enum(["push", "pull", "legs", "upper", "lower", "full", "custom"]),
  startedAt: z.string(),
  endedAt: z.string(),
  durationSec: z.number(),
  exercises: z.array(loggedExercise),
  notes: z.string().default(""),
});

const plan = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["push", "pull", "legs", "upper", "lower", "full", "custom"]),
  exercises: z.array(
    z.object({
      id: z.string(),
      exerciseId: z.string(),
      sets: z.number(),
      repMin: z.number(),
      repMax: z.number(),
      targetWeight: z.number().nullable(),
      restSec: z.number(),
      notes: z.string().default(""),
    }),
  ),
  notes: z.string().default(""),
  scheduledDays: z.array(z.number()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const foodLog = z.object({
  id: z.string(),
  date: dateKey,
  time: z.string(),
  meal: z.enum(["breakfast", "lunch", "snack", "dinner", "other"]),
  foodId: z.string(),
  foodName: z.string(),
  servingLabel: z.string(),
  servingGrams: z.number(),
  quantity: z.number().positive(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const settings = z.object({
  weightUnit: z.enum(["kg", "lb"]),
  heightUnit: z.enum(["cm", "ft"]),
  waterGoalMl: z.number(),
  defaultRestSec: z.number(),
  notifications: z.object({
    restTimerSound: z.boolean(),
    prCelebrations: z.boolean(),
    workoutReminders: z.boolean(),
  }),
  sidebarCollapsed: z.boolean(),
  demoMode: z.boolean(),
});

export const exportFileSchema = z.object({
  app: z.literal("forge"),
  version: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    profile: profileSchema.nullable(),
    settings,
    plans: z.array(plan),
    history: z.array(session),
    foodLogs: z.array(foodLog),
    weights: z.array(z.object({ id: z.string(), date: dateKey, weightKg: z.number().positive() })),
    measurements: z.array(
      z.object({ id: z.string(), date: dateKey, values: z.record(z.string(), z.number()) }),
    ),
    water: z.record(z.string(), z.number()),
    photos: z.array(
      z.object({ id: z.string(), date: dateKey, pose: z.enum(["front", "side", "back"]), dataUrl: z.string() }),
    ),
  }),
});
