import { z } from "zod";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (yyyy-MM-dd required)");

export const addWeightSchema = z.object({
  date: dateKey,
  weightKg: z.number().min(10, "Weight too low").max(500, "Weight too high"),
});

export const updateWeightSchema = z.object({
  weightKg: z.number().min(10).max(500),
});

export const weightQuerySchema = z.object({
  from: dateKey.optional(),
  to: dateKey.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const measurementValuesSchema = z
  .object({
    chest: z.number().min(1).max(300).optional(),
    waist: z.number().min(1).max(300).optional(),
    arms: z.number().min(1).max(200).optional(),
    thighs: z.number().min(1).max(200).optional(),
    shoulders: z.number().min(1).max(300).optional(),
    hips: z.number().min(1).max(300).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "At least one measurement value required",
  });

export const addMeasurementSchema = z.object({
  date: dateKey,
  values: measurementValuesSchema,
});

export const updateMeasurementSchema = z.object({
  values: measurementValuesSchema,
});

export const addWaterSchema = z.object({
  date: dateKey,
  amountMl: z.number().int().min(1, "Amount must be positive").max(10000),
});

export const photoQuerySchema = z.object({
  from: dateKey.optional(),
  to: dateKey.optional(),
  pose: z.enum(["front", "side", "back"]).optional(),
});

export const photoBodySchema = z.object({
  date: dateKey,
  pose: z.enum(["front", "side", "back"]),
});
