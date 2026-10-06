import { z } from "zod";

export const settingsSchema = z.object({
  weightUnit: z.enum(["kg", "lb"]),
  heightUnit: z.enum(["cm", "ft"]),
  waterGoalMl: z.number().int().min(500).max(10000),
  defaultRestSec: z.number().int().min(0).max(600),
  notifications: z.object({
    restTimerSound: z.boolean(),
    prCelebrations: z.boolean(),
    workoutReminders: z.boolean(),
  }),
  sidebarCollapsed: z.boolean(),
  demoMode: z.boolean(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export const settingsPatchSchema = settingsSchema.partial();
