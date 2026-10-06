import { z } from "zod";

const foodLogEntrySchema = z.object({
  id: z.string().optional(),
  foodId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  meal: z.enum(["breakfast", "lunch", "snack", "dinner", "other"]),
  servingLabel: z.string().min(1),
  servingGrams: z.coerce.number().min(0).max(10000),
  quantity: z.coerce.number().min(0.01).max(100),
  // Macros are snapshotted at log time — required on create
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  foodName: z.string().min(1), // snapshotted food name
});

export const addFoodEntriesSchema = z.object({
  entries: z.array(foodLogEntrySchema).min(1).max(20),
});

export const updateFoodEntrySchema = foodLogEntrySchema.partial().omit({ foodId: true });

export const nutritionQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meal: z.enum(["breakfast", "lunch", "snack", "dinner", "other"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const foodSearchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
