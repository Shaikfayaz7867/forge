import { ACTIVITY_LEVELS, FAT_SHARE, GOALS, PROTEIN_PER_KG } from "@/data/constants";
import type { Profile } from "./types";

export function calcBMI(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  if (m <= 0) return 0;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): { label: string; tone: "low" | "ok" | "high" } {
  if (bmi < 18.5) return { label: "Below range", tone: "low" };
  if (bmi < 25) return { label: "Healthy range", tone: "ok" };
  if (bmi < 30) return { label: "Above range", tone: "high" };
  return { label: "Well above range", tone: "high" };
}

/** Mifflin-St Jeor. "Other" uses the midpoint of the male/female constants. */
export function calcBMR(p: Pick<Profile, "weightKg" | "heightCm" | "age" | "gender">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  const offset = p.gender === "male" ? 5 : p.gender === "female" ? -161 : -78;
  return base + offset;
}

export function activityMultiplier(activity: Profile["activity"]): number {
  return ACTIVITY_LEVELS.find((a) => a.id === activity)?.multiplier ?? 1.2;
}

export function calcTDEE(p: Profile): number {
  return calcBMR(p) * activityMultiplier(p.activity);
}

export function goalDelta(goal: Profile["goal"]): number {
  return GOALS.find((g) => g.id === goal)?.calorieDelta ?? 0;
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export interface Targets {
  bmi: number;
  bmr: number;
  tdee: number;
  maintenance: number;
  calculatedCalories: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isOverride: boolean;
}

export function calcTargets(p: Profile): Targets {
  const bmr = calcBMR(p);
  const tdee = bmr * activityMultiplier(p.activity);
  const calculatedCalories = Math.max(1200, roundTo(tdee + goalDelta(p.goal), 10));
  const calories = p.calorieOverride ?? calculatedCalories;
  const protein = Math.round(p.weightKg * PROTEIN_PER_KG[p.goal]);
  const fat = Math.round((calories * FAT_SHARE[p.goal]) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return {
    bmi: calcBMI(p.weightKg, p.heightCm),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    maintenance: roundTo(tdee, 10),
    calculatedCalories,
    calories,
    protein,
    carbs,
    fat,
    isOverride: p.calorieOverride !== null,
  };
}
