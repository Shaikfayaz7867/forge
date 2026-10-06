import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { muscleGroups } from "@/data/constants";
import { addDays, format } from "date-fns";
import { calcTargets, type Targets } from "./calculations";
import { fromDateKey, isoToDateKey, lastNDays, toDateKey, weekStart } from "./dates";
import { sumMacros } from "./nutrition";
import type { ForgeData, Macros, WorkoutSession } from "./types";
import {
  computePRs,
  exerciseTimeline,
  loggedExerciseIds,
  muscleGroupStats,
  sessionSetCount,
  sessionVolume,
  sessionsOnDate,
} from "./workout-stats";
import { formatWeight } from "./units";

type Data = Pick<ForgeData, "profile" | "settings" | "history" | "foodLogs" | "weights" | "water">;

/* -------------------------------- Daily summary -------------------------------- */

export interface DaySummary {
  date: string;
  sessions: WorkoutSession[];
  macros: Macros;
  foodCount: number;
  weightKg: number | null;
  waterMl: number;
}

export function daySummary(d: Data, date: string): DaySummary {
  const entries = d.foodLogs.filter((f) => f.date === date);
  return {
    date,
    sessions: sessionsOnDate(d.history, date),
    macros: sumMacros(entries),
    foodCount: entries.length,
    weightKg: d.weights.find((w) => w.date === date)?.weightKg ?? null,
    waterMl: d.water[date] ?? 0,
  };
}

/** Per-day macro totals for a list of date keys (0 for unlogged days). */
export function macrosByDay(d: Pick<Data, "foodLogs">, keys: string[]): (Macros & { date: string; logged: boolean })[] {
  const byDate = new Map<string, Macros[]>();
  for (const f of d.foodLogs) {
    const arr = byDate.get(f.date);
    if (arr) arr.push(f);
    else byDate.set(f.date, [f]);
  }
  return keys.map((date) => {
    const list = byDate.get(date);
    return { date, logged: !!list?.length, ...sumMacros(list ?? []) };
  });
}

/* -------------------------------- Weight trend -------------------------------- */

/** Least-squares slope in kg/week across the given entries. */
export function weightTrendPerWeek(entries: { date: string; weightKg: number }[]): number {
  if (entries.length < 2) return 0;
  const t0 = fromDateKey(entries[0].date).getTime();
  const xs = entries.map((e) => (fromDateKey(e.date).getTime() - t0) / 86400000);
  const ys = entries.map((e) => e.weightKg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : (num / den) * 7;
}

/* -------------------------------- Weekly review -------------------------------- */

export interface WeeklyReview {
  start: string;
  end: string;
  workouts: number;
  target: number;
  totalVolume: number;
  totalSets: number;
  prs: number;
  favoriteExercise: string | null;
  volumeChangePct: number | null;
  avgCalories: number | null;
  avgProtein: number | null;
  calorieConsistencyPct: number | null;
  daysLogged: number;
  startWeight: number | null;
  endWeight: number | null;
  workoutConsistencyPct: number;
  loggingConsistencyPct: number;
  summary: string;
}

export function weeklyReview(d: Data, anchor: Date = new Date()): WeeklyReview {
  const start = weekStart(anchor);
  const keys = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
  const startKey = keys[0];
  const endKey = keys[6];
  const today = toDateKey(new Date());
  const elapsedKeys = keys.filter((k) => k <= today);

  const inWeek = d.history.filter((s) => {
    const k = isoToDateKey(s.startedAt);
    return k >= startKey && k <= endKey;
  });
  const totalVolume = Math.round(inWeek.reduce((s, x) => s + sessionVolume(x), 0));
  const totalSets = inWeek.reduce((s, x) => s + sessionSetCount(x), 0);
  const prs = computePRs(d.history).events.filter((e) => e.date >= startKey && e.date <= endKey).length;
  const fav = loggedExerciseIds(inWeek)[0] ?? null;

  // Compare to the average of the previous 4 weeks that had any training.
  const prevVolumes = [1, 2, 3, 4]
    .map((w) => {
      const s = toDateKey(addDays(start, -7 * w));
      const e = toDateKey(addDays(start, -7 * w + 6));
      return d.history
        .filter((x) => {
          const k = isoToDateKey(x.startedAt);
          return k >= s && k <= e;
        })
        .reduce((sum, x) => sum + sessionVolume(x), 0);
    })
    .filter((v) => v > 0);
  const prevAvg = prevVolumes.length ? prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length : 0;
  const volumeChangePct = prevAvg > 0 && totalVolume > 0 ? Math.round(((totalVolume - prevAvg) / prevAvg) * 100) : null;

  const days = macrosByDay(d, elapsedKeys).filter((x) => x.logged);
  const targets: Targets | null = d.profile ? calcTargets(d.profile) : null;
  const avgCalories = days.length ? Math.round(days.reduce((s, x) => s + x.calories, 0) / days.length) : null;
  const avgProtein = days.length ? Math.round(days.reduce((s, x) => s + x.protein, 0) / days.length) : null;
  const calorieConsistencyPct =
    targets && days.length
      ? Math.round((days.filter((x) => Math.abs(x.calories - targets.calories) <= targets.calories * 0.1).length / days.length) * 100)
      : null;

  const wk = d.weights.filter((w) => w.date >= startKey && w.date <= endKey);
  const before = [...d.weights].reverse().find((w) => w.date < startKey);
  const startWeight = before?.weightKg ?? wk[0]?.weightKg ?? null;
  const endWeight = wk.at(-1)?.weightKg ?? null;

  const target = d.profile?.trainingDays ?? 4;
  const workoutDays = new Set(inWeek.map((s) => isoToDateKey(s.startedAt))).size;
  const workoutConsistencyPct = Math.min(100, Math.round((workoutDays / target) * 100));
  const loggingConsistencyPct = elapsedKeys.length ? Math.round((days.length / elapsedKeys.length) * 100) : 0;

  const parts: string[] = [];
  if (inWeek.length === 0) parts.push("No workouts logged this week yet.");
  else {
    let s = `You trained ${inWeek.length} ${inWeek.length === 1 ? "time" : "times"} this week`;
    if (volumeChangePct !== null && volumeChangePct !== 0)
      s += ` and ${volumeChangePct > 0 ? "increased" : "decreased"} your weekly volume by ${Math.abs(volumeChangePct)}% versus your recent average`;
    parts.push(`${s}.`);
  }
  if (avgProtein !== null && targets)
    parts.push(`Average protein was ${avgProtein}g against a ${targets.protein}g target.`);
  if (startWeight !== null && endWeight !== null && startWeight !== endWeight) {
    const diff = endWeight - startWeight;
    parts.push(`Body weight ${diff > 0 ? "rose" : "dropped"} by ${formatWeight(Math.abs(diff), d.settings.weightUnit)}.`);
  }

  return {
    start: startKey,
    end: endKey,
    workouts: inWeek.length,
    target,
    totalVolume,
    totalSets,
    prs,
    favoriteExercise: fav,
    volumeChangePct,
    avgCalories,
    avgProtein,
    calorieConsistencyPct,
    daysLogged: days.length,
    startWeight,
    endWeight,
    workoutConsistencyPct,
    loggingConsistencyPct,
    summary: parts.join(" "),
  };
}

/* ---------------------------------- Insights ---------------------------------- */

export type InsightTone = "positive" | "neutral" | "attention";
export type InsightKind = "protein" | "calories" | "workouts" | "strength" | "muscle" | "weight" | "water";

export interface Insight {
  id: string;
  kind: InsightKind;
  tone: InsightTone;
  text: string;
}

export function buildInsights(d: Data): Insight[] {
  const out: Insight[] = [];
  if (!d.profile) return out;
  const targets = calcTargets(d.profile);
  const unit = d.settings.weightUnit;
  // Exclude today from nutrition averages: the day isn't over yet.
  const last7 = lastNDays(8).slice(0, 7);
  const logged = macrosByDay(d, last7).filter((x) => x.logged);

  if (logged.length >= 3) {
    const below = logged.filter((x) => x.protein < targets.protein * 0.9).length;
    if (below >= Math.ceil(logged.length / 2))
      out.push({ id: "protein-low", kind: "protein", tone: "attention", text: `Protein was below your ${targets.protein}g target on ${below} of the last ${logged.length} logged days.` });
    else
      out.push({ id: "protein-ok", kind: "protein", tone: "positive", text: `You hit at least 90% of your protein target on ${logged.length - below} of the last ${logged.length} logged days.` });

    const avg = Math.round(logged.reduce((s, x) => s + x.calories, 0) / logged.length);
    const diff = avg - targets.calories;
    if (Math.abs(diff) >= 100)
      out.push({ id: "calories", kind: "calories", tone: "attention", text: `Your average intake is ${Math.abs(diff).toLocaleString()} kcal ${diff < 0 ? "below" : "above"} your ${targets.calories.toLocaleString()} kcal target.` });
    else
      out.push({ id: "calories", kind: "calories", tone: "positive", text: `Average intake is within 100 kcal of your target — nicely consistent.` });
  }

  const ws = weekStart();
  const thisWeek = d.history.filter((s) => isoToDateKey(s.startedAt) >= toDateKey(ws)).length;
  out.push({
    id: "workouts-week",
    kind: "workouts",
    tone: thisWeek >= d.profile.trainingDays ? "positive" : "neutral",
    text: `You've completed ${thisWeek} of ${d.profile.trainingDays} planned workouts this week.`,
  });

  // Biggest strength change over the last 30 days.
  const since = toDateKey(addDays(new Date(), -30));
  let best: { name: string; diff: number } | null = null;
  for (const id of loggedExerciseIds(d.history).slice(0, 12)) {
    const t = exerciseTimeline(d.history, id).filter((p) => p.date >= since);
    if (t.length < 2) continue;
    const diff = Math.max(...t.map((p) => p.maxWeight)) - t[0].maxWeight;
    if (diff > 0 && (!best || diff > best.diff)) best = { name: exerciseById(getForgeState())[id]?.name ?? id, diff };
  }
  if (best)
    out.push({ id: "strength", kind: "strength", tone: "positive", text: `Your ${best.name.toLowerCase()} increased by ${formatWeight(best.diff, unit)} over the last 30 days.` });

  const stats = muscleGroupStats(d.history, toDateKey(addDays(new Date(), -14))).filter((m) => m.muscle !== "core");
  const total = stats.reduce((s, m) => s + m.sets, 0);
  if (total > 0) {
    const avg = total / stats.length;
    const low = stats.filter((m) => m.sets < avg * 0.45).sort((a, b) => a.sets - b.sets)[0];
    if (low) {
      const label = muscleGroups.find((g) => g.id === low.muscle)?.label ?? low.muscle;
      out.push({ id: "muscle", kind: "muscle", tone: "attention", text: `${label} had ${low.sets} sets in the last 14 days — the lowest of your muscle groups.` });
    }
  }

  const recentWeights = d.weights.filter((w) => w.date >= toDateKey(addDays(new Date(), -28)));
  if (recentWeights.length >= 4) {
    const rate = weightTrendPerWeek(recentWeights);
    const gaining = ["build_muscle", "gain_weight", "strength"].includes(d.profile.goal);
    const losing = d.profile.goal === "lose_fat";
    const dir = rate > 0.05 ? "up" : rate < -0.05 ? "down" : "flat";
    const aligned = (gaining && dir === "up") || (losing && dir === "down") || (!gaining && !losing && dir === "flat");
    const text =
      dir === "flat"
        ? "Your weight has been stable over the last 4 weeks."
        : `Your weight is trending ${dir} ${formatWeight(Math.abs(rate), unit, 2)} per week over the last 4 weeks.`;
    out.push({ id: "weight", kind: "weight", tone: aligned ? "positive" : "neutral", text });
  }

  const waterDays = last7.map((k) => d.water[k] ?? 0).filter((v) => v > 0);
  if (waterDays.length >= 3) {
    const avg = waterDays.reduce((a, b) => a + b, 0) / waterDays.length;
    if (avg < d.settings.waterGoalMl * 0.8)
      out.push({ id: "water", kind: "water", tone: "attention", text: `Average water intake is ${(avg / 1000).toFixed(1)}L, below your ${(d.settings.waterGoalMl / 1000).toFixed(1)}L goal.` });
  }

  return out;
}

export const formatRangeLabel = (start: string, end: string) =>
  `${format(fromDateKey(start), "MMM d")} – ${format(fromDateKey(end), "MMM d")}`;
