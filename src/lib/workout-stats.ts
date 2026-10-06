import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { addDays, differenceInCalendarWeeks, startOfWeek } from "date-fns";
import { fromDateKey, isoToDateKey, toDateKey, weekStart } from "./dates";
import type { LoggedExercise, MuscleGroup, WorkoutSession } from "./types";

/* ---------------------------------- Basics ---------------------------------- */

export const completedSets = (ex: LoggedExercise) => (ex.sets || []).filter((s) => s.completed);

export function exerciseVolume(ex: LoggedExercise): number {
  return completedSets(ex).reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function sessionVolume(session: Pick<WorkoutSession, "exercises">): number {
  return session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
}

export function sessionSetCount(session: Pick<WorkoutSession, "exercises">): number {
  return session.exercises.reduce((sum, ex) => sum + completedSets(ex).length, 0);
}

export function sessionExercisesCompleted(session: Pick<WorkoutSession, "exercises">): number {
  return session.exercises.filter((ex) => completedSets(ex).length > 0).length;
}

/** Epley estimated one-rep max. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export const sortByDate = (history: WorkoutSession[]) =>
  [...history].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

/* ---------------------------- Per-exercise progress ---------------------------- */

export interface ExercisePoint {
  date: string;
  sessionId: string;
  maxWeight: number;
  repsAtMax: number;
  bestReps: number;
  e1rm: number;
  volume: number;
  sets: number;
}

export function exerciseTimeline(history: WorkoutSession[], exerciseId: string): ExercisePoint[] {
  const points: ExercisePoint[] = [];
  for (const s of sortByDate(history)) {
    const exs = s.exercises.filter((e) => e.exerciseId === exerciseId);
    const sets = exs.flatMap(completedSets);
    if (sets.length === 0) continue;
    let maxWeight = 0;
    let repsAtMax = 0;
    let bestReps = 0;
    let e1rm = 0;
    let volume = 0;
    for (const set of sets) {
      if (set.weight > maxWeight || (set.weight === maxWeight && set.reps > repsAtMax)) {
        maxWeight = set.weight;
        repsAtMax = set.reps;
      }
      bestReps = Math.max(bestReps, set.reps);
      e1rm = Math.max(e1rm, estimate1RM(set.weight, set.reps));
      volume += set.weight * set.reps;
    }
    points.push({
      date: isoToDateKey(s.startedAt),
      sessionId: s.id,
      maxWeight,
      repsAtMax,
      bestReps,
      e1rm: Math.round(e1rm * 10) / 10,
      volume,
      sets: sets.length,
    });
  }
  return points;
}

export interface ExerciseSummary {
  exerciseId: string;
  maxWeight: number;
  bestReps: number;
  best1RM: number;
  totalVolume: number;
  sessions: number;
  lastPerformed: string | null;
}

export function exerciseSummary(history: WorkoutSession[], exerciseId: string): ExerciseSummary {
  const t = exerciseTimeline(history, exerciseId);
  return {
    exerciseId,
    maxWeight: Math.max(0, ...t.map((p) => p.maxWeight)),
    bestReps: Math.max(0, ...t.map((p) => p.bestReps)),
    best1RM: Math.max(0, ...t.map((p) => p.e1rm)),
    totalVolume: t.reduce((s, p) => s + p.volume, 0),
    sessions: t.length,
    lastPerformed: t.at(-1)?.date ?? null,
  };
}

/** Exercises the user has actually logged, most frequent first. */
export function loggedExerciseIds(history: WorkoutSession[]): string[] {
  const counts = new Map<string, number>();
  for (const s of history)
    for (const e of s.exercises)
      if (completedSets(e).length) counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/** The last time this exercise was performed (for "previous" hints in sessions). */
export function previousPerformance(
  history: WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string,
): LoggedExercise | null {
  const sorted = sortByDate(history).reverse();
  for (const s of sorted) {
    if (s.id === excludeSessionId) continue;
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId && completedSets(e).length);
    if (ex) return ex;
  }
  return null;
}

/* ------------------------------ Personal records ------------------------------ */

export interface PREvent {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  previous: number;
  date: string;
  sessionId: string;
}

/**
 * Walks history chronologically and records a PR whenever a session's heaviest
 * completed set beats the previous best for that exercise. The first time an
 * exercise is logged establishes a baseline and is not counted as a PR.
 */
export function computePRs(history: WorkoutSession[]): {
  events: PREvent[];
  bests: Record<string, { weight: number; reps: number; date: string }>;
} {
  const bests: Record<string, { weight: number; reps: number; date: string }> = {};
  const events: PREvent[] = [];
  for (const s of sortByDate(history)) {
    const date = isoToDateKey(s.startedAt);
    for (const ex of s.exercises) {
      const sets = completedSets(ex).filter((x) => x.weight > 0);
      if (!sets.length) continue;
      const top = sets.reduce((a, b) => (b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a));
      const prev = bests[ex.exerciseId];
      if (!prev) {
        bests[ex.exerciseId] = { weight: top.weight, reps: top.reps, date };
      } else if (top.weight > prev.weight) {
        events.push({
          id: `${s.id}-${ex.exerciseId}`,
          exerciseId: ex.exerciseId,
          weight: top.weight,
          reps: top.reps,
          previous: prev.weight,
          date,
          sessionId: s.id,
        });
        bests[ex.exerciseId] = { weight: top.weight, reps: top.reps, date };
      }
    }
  }
  return { events, bests };
}

/** PRs that a just-finished session would set, relative to earlier history. */
export function detectSessionPRs(history: WorkoutSession[], session: WorkoutSession): PREvent[] {
  const { events } = computePRs([...history.filter((h) => h.id !== session.id), session]);
  return events.filter((e) => e.sessionId === session.id);
}

/* ------------------------------- Muscle groups ------------------------------- */

export interface MuscleStat {
  muscle: MuscleGroup;
  sets: number;
  sessions: number;
  volume: number;
}

export function muscleGroupStats(history: WorkoutSession[], sinceKey?: string): MuscleStat[] {
  const map = new Map<MuscleGroup, MuscleStat>();
  const groups: MuscleGroup[] = ["chest", "back", "shoulders", "legs", "arms", "core"];
  for (const g of groups) map.set(g, { muscle: g, sets: 0, sessions: 0, volume: 0 });
  for (const s of history) {
    if (sinceKey && isoToDateKey(s.startedAt) < sinceKey) continue;
    const touched = new Set<MuscleGroup>();
    for (const ex of s.exercises) {
      const meta = exerciseById(getForgeState())[ex.exerciseId];
      if (!meta) continue;
      const done = completedSets(ex);
      if (!done.length) continue;
      const stat = map.get(meta.muscleGroup)!;
      stat.sets += done.length;
      stat.volume += exerciseVolume(ex);
      touched.add(meta.muscleGroup);
    }
    for (const g of touched) map.get(g)!.sessions += 1;
  }
  return groups.map((g) => map.get(g)!);
}

/* ---------------------------------- Volume ---------------------------------- */

export function volumeByDay(history: WorkoutSession[], keys: string[]): { date: string; volume: number }[] {
  const totals = new Map<string, number>();
  for (const s of history) {
    const k = isoToDateKey(s.startedAt);
    totals.set(k, (totals.get(k) ?? 0) + sessionVolume(s));
  }
  return keys.map((date) => ({ date, volume: Math.round(totals.get(date) ?? 0) }));
}

export function volumeByWeek(history: WorkoutSession[], weeks: number): { week: string; volume: number; sessions: number }[] {
  const start = addDays(weekStart(), -7 * (weeks - 1));
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    week: toDateKey(addDays(start, i * 7)),
    volume: 0,
    sessions: 0,
  }));
  for (const s of history) {
    const d = new Date(s.startedAt);
    const idx = differenceInCalendarWeeks(d, start, { weekStartsOn: 1 });
    if (idx >= 0 && idx < weeks) {
      buckets[idx].volume += sessionVolume(s);
      buckets[idx].sessions += 1;
    }
  }
  return buckets.map((b) => ({ ...b, volume: Math.round(b.volume) }));
}

export function volumeByMonth(history: WorkoutSession[], months: number): { month: string; volume: number }[] {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, month: toDateKey(d), volume: 0 };
  });
  for (const s of history) {
    const key = s.startedAt.slice(0, 7);
    const b = buckets.find((x) => x.key === key);
    if (b) b.volume += sessionVolume(s);
  }
  return buckets.map(({ month, volume }) => ({ month, volume: Math.round(volume) }));
}

/* ------------------------------ Consistency ------------------------------ */

export function sessionsOnDate(history: WorkoutSession[], key: string): WorkoutSession[] {
  return history.filter((s) => isoToDateKey(s.startedAt) === key);
}

export function workoutDayKeys(history: WorkoutSession[]): Set<string> {
  return new Set(history.map((s) => isoToDateKey(s.startedAt)));
}

/**
 * Consecutive weeks (Mon–Sun) in which the weekly target was met. The current
 * week counts only once it has met the target, but never breaks the streak.
 */
export function weeklyStreak(history: WorkoutSession[], target: number): number {
  const counts = new Map<string, number>();
  for (const s of history) {
    const k = toDateKey(startOfWeek(new Date(s.startedAt), { weekStartsOn: 1 }));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let streak = 0;
  let cursor = weekStart();
  if ((counts.get(toDateKey(cursor)) ?? 0) >= target) streak++;
  cursor = addDays(cursor, -7);
  while ((counts.get(toDateKey(cursor)) ?? 0) >= target) {
    streak++;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

/** Consecutive days with an entry, ending today (or yesterday if today is empty). */
export function dayStreak(keys: Set<string>, today: string = toDateKey(new Date())): number {
  let cursor = fromDateKey(today);
  if (!keys.has(today)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (keys.has(toDateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
