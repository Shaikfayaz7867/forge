import { fromDateKey, isoToDateKey } from "./dates";
import type { WorkoutPlan, WorkoutSession } from "./types";

/** Plan scheduled for this weekday, if any. */
export function scheduledPlan(plans: WorkoutPlan[], dateKey: string): WorkoutPlan | null {
  const dow = fromDateKey(dateKey).getDay();
  return plans.find((p) => p.scheduledDays.includes(dow)) ?? null;
}

/** The plan that hasn't been trained for the longest time — a sensible "next up". */
export function nextUpPlan(plans: WorkoutPlan[], history: WorkoutSession[]): WorkoutPlan | null {
  if (!plans.length) return null;
  const last = new Map<string, string>();
  for (const s of history) if (s.planId) {
    const prev = last.get(s.planId);
    if (!prev || s.startedAt > prev) last.set(s.planId, s.startedAt);
  }
  return [...plans].sort((a, b) => (last.get(a.id) ?? "").localeCompare(last.get(b.id) ?? ""))[0];
}

export interface TodayWorkout {
  plan: WorkoutPlan | null;
  completed: WorkoutSession[];
  isRestDay: boolean;
}

export function todayWorkout(plans: WorkoutPlan[], history: WorkoutSession[], dateKey: string): TodayWorkout {
  const completed = history.filter((s) => isoToDateKey(s.startedAt) === dateKey);
  const scheduled = scheduledPlan(plans, dateKey);
  return {
    plan: scheduled ?? nextUpPlan(plans, history),
    completed,
    isRestDay: !scheduled && plans.some((p) => p.scheduledDays.length > 0),
  };
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
