"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { muscleGroups } from "@/data/constants";
import { addDays, format, subMonths } from "date-fns";
import { motion } from "motion/react";
import { Activity, CalendarCheck, Dumbbell, Flame, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExerciseProgressChart, MuscleRadar, VolumeChart } from "@/components/charts/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard, StatCard } from "@/components/shared/metric-card";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { Segmented } from "@/components/shared/segmented";
import { RANGE_OPTIONS, type RangeId } from "@/data/constants";
import { useToday } from "@/hooks/use-forge-derived";
import { fromDateKey, isoToDateKey, lastNDays, toDateKey, weekStart } from "@/lib/dates";
import { formatNumber, formatVolume, formatWeight, toDisplayVolume, toDisplayWeight } from "@/lib/units";
import {
  computePRs,
  dayStreak,
  exerciseSummary,
  exerciseTimeline,
  loggedExerciseIds,
  muscleGroupStats,
  volumeByDay,
  volumeByMonth,
  volumeByWeek,
  weeklyStreak,
} from "@/lib/workout-stats";
import { cn } from "@/lib/utils";
import { useForge } from "@/store/forge-store";
import { MuscleBars } from "./muscle-bars";
import { PRCard } from "./pr-list";

type Metric = "maxWeight" | "e1rm" | "volume" | "bestReps";
const METRICS: { id: Metric; label: string }[] = [
  { id: "maxWeight", label: "Top set" },
  { id: "e1rm", label: "Est. 1RM" },
  { id: "volume", label: "Volume" },
  { id: "bestReps", label: "Best reps" },
];
type VolumeView = "daily" | "weekly" | "monthly";
type MuscleRange = "7" | "14" | "30";

export function ProgressView() {
  const { history, foodLogs, settings, profile } = useForge();
  const unit = settings.weightUnit;
  const today = useToday();
  const logged = useMemo(() => loggedExerciseIds(history), [history]);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const exId = exerciseId ?? (logged.includes("bench-press") ? "bench-press" : logged[0]) ?? null;
  const [metric, setMetric] = useState<Metric>("maxWeight");
  const [range, setRange] = useState<RangeId>("3m");
  const [volumeView, setVolumeView] = useState<VolumeView>("weekly");
  const [muscleRange, setMuscleRange] = useState<MuscleRange>("14");

  const timeline = useMemo(() => (exId ? exerciseTimeline(history, exId) : []), [history, exId]);
  const rangeDays = RANGE_OPTIONS.find((r) => r.id === range)!.days;
  const since = Number.isFinite(rangeDays) ? toDateKey(addDays(fromDateKey(today), -rangeDays)) : "0000";
  const visible = timeline.filter((p) => p.date >= since);
  const summary = exId ? exerciseSummary(history, exId) : null;

  const metricValue = (p: (typeof timeline)[number]) =>
    metric === "volume" ? toDisplayVolume(p.volume, unit) : metric === "bestReps" ? p.bestReps : toDisplayWeight(metric === "e1rm" ? p.e1rm : p.maxWeight, unit);
  const metricUnit = metric === "volume" ? unit : metric === "bestReps" ? "reps" : unit;
  const delta = visible.length >= 2 ? metricValue(visible.at(-1)!) - metricValue(visible[0]) : 0;

  const { events, bests } = useMemo(() => computePRs(history), [history]);
  const weekStartKey = toDateKey(weekStart(fromDateKey(today)));
  const monthStartKey = today.slice(0, 8) + "01";
  const prsWeek = events.filter((e) => e.date >= weekStartKey).length;
  const prsMonth = events.filter((e) => e.date >= monthStartKey).length;
  const recentPRs = [...events].reverse().slice(0, 8);
  const records = Object.entries(bests)
    .map(([id, b]) => ({ id, ...b }))
    .sort((a, b) => b.weight - a.weight);

  const volumeData = useMemo(() => {
    if (volumeView === "daily") return volumeByDay(history, lastNDays(30, fromDateKey(today))).map((d) => ({ x: d.date, volume: d.volume }));
    if (volumeView === "weekly") return volumeByWeek(history, 12).map((d) => ({ x: d.week, volume: d.volume }));
    return volumeByMonth(history, 6).map((d) => ({ x: d.month, volume: d.volume }));
  }, [history, volumeView, today]);
  const volumeFormat = volumeView === "monthly" ? (k: string) => format(fromDateKey(k), "MMM") : (k: string) => format(fromDateKey(k), "MMM d");

  const muscles = useMemo(() => muscleGroupStats(history, toDateKey(addDays(fromDateKey(today), -Number(muscleRange)))), [history, muscleRange, today]);

  const sessionsThisMonth = history.filter((s) => isoToDateKey(s.startedAt) >= monthStartKey).length;
  const lastMonthStart = toDateKey(subMonths(fromDateKey(monthStartKey), 1));
  const lastMonthSessions = history.filter((s) => {
    const k = isoToDateKey(s.startedAt);
    return k >= lastMonthStart && k < monthStartKey;
  }).length;
  const streakWeeks = weeklyStreak(history, profile!.trainingDays);
  const logStreak = dayStreak(new Set(foodLogs.map((f) => f.date)), today);
  const weekly = volumeByWeek(history, 8);

  if (!history.length) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Progress" title="Am I getting stronger?" />
        <div className="surface-card">
          <EmptyState icon={Activity} title="No training data yet" description="Finish your first workout and your strength, volume and PRs will appear here." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Progress" title="Am I getting stronger?" description="Strength, volume, records and consistency — calculated from your logged sets." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="PRs this month" value={prsMonth} icon={Trophy} hint={`${prsWeek} this week`} />
        <MetricCard label="Sessions this month" value={sessionsThisMonth} icon={CalendarCheck} hint={`${lastMonthSessions} last month`} />
        <MetricCard label="Workout streak" value={streakWeeks} unit={streakWeeks === 1 ? "week" : "weeks"} icon={Flame} hint={`${profile!.trainingDays}+ sessions / week`} />
        <MetricCard label="Logging streak" value={logStreak} unit={logStreak === 1 ? "day" : "days"} icon={Activity} hint="Nutrition" />
      </div>

      {/* Exercise progression */}
      <section className="surface-card p-5 sm:p-7" aria-labelledby="ex-progress">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="ex-progress" className="sr-only">
              Exercise progression
            </h2>
            <Select value={exId ?? undefined} onValueChange={setExerciseId}>
              <SelectTrigger className="h-11! min-w-56 rounded-xl text-base font-semibold" aria-label="Exercise">
                <SelectValue placeholder="Choose exercise" />
              </SelectTrigger>
              <SelectContent>
                {logged.map((id) => (
                  <SelectItem key={id} value={id}>
                    {exerciseById(getForgeState())[id]?.name ?? id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Segmented label="Metric" value={metric} onChange={setMetric} options={METRICS} />
          </div>
          <Segmented label="Time range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
        </div>

        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-4 border-b pb-5 sm:grid-cols-5">
            <StatCard label="Max weight" value={formatWeight(summary.maxWeight, unit)} />
            <StatCard label="Best reps" value={summary.bestReps} />
            <StatCard label="Est. 1RM" value={formatWeight(summary.best1RM, unit)} />
            <StatCard label="Total volume" value={formatVolume(summary.totalVolume, unit)} />
            <StatCard label="Sessions" value={summary.sessions} />
          </div>
        )}

        <div className="mt-5">
          {visible.length >= 2 ? (
            <>
              <p className="mb-2 text-sm">
                <span className={cn("num font-semibold", delta > 0 ? "text-brand-ink" : delta < 0 ? "text-warning" : "")}>
                  {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
                  {formatNumber(Math.abs(delta), 1)} {metricUnit}
                </span>
                <span className="text-muted-foreground"> over {RANGE_OPTIONS.find((r) => r.id === range)?.label === "All" ? "all time" : `the last ${RANGE_OPTIONS.find((r) => r.id === range)?.label}`}</span>
              </p>
              <ExerciseProgressChart data={visible.map((p) => ({ date: p.date, value: metricValue(p) }))} dataKey="value" label={METRICS.find((m) => m.id === metric)!.label} unit={metricUnit} />
            </>
          ) : (
            <EmptyState compact icon={Dumbbell} title="Not enough sessions in this range" description="Pick a longer range or log this exercise a few more times." />
          )}
        </div>
      </section>

      {/* Personal records */}
      <section id="prs" className="grid scroll-mt-24 gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="surface-card p-5 sm:p-7">
          <SectionTitle title="Personal records" description="Heaviest completed set per exercise" />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {records.slice(0, 10).map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 22 }}
                className="flex items-center gap-3 rounded-2xl border bg-surface p-3"
              >
                <Trophy className={cn("size-4 shrink-0", i < 3 ? "text-brand-ink" : "text-muted-foreground")} strokeWidth={1.75} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm">{exerciseById(getForgeState())[r.id]?.name ?? r.id}</span>
                <span className="num text-sm font-semibold">{formatWeight(r.weight, unit)}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="surface-card p-5 sm:p-7">
          <SectionTitle title="Recent PRs" description={`${prsWeek} this week · ${prsMonth} this month`} />
          {recentPRs.length ? (
            <ul className="mt-4 space-y-2">
              {recentPRs.map((pr, i) => (
                <PRCard key={pr.id} pr={pr} unit={unit} index={i} highlight={pr.date >= weekStartKey} />
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Trophy} title="No PRs yet" description="Beat a previous best weight to set one." />
          )}
        </div>
      </section>

      {/* Volume */}
      <section className="surface-card p-5 sm:p-7">
        <SectionTitle
          title="Training volume"
          description="Sets × reps × weight, completed sets only"
          action={
            <Segmented
              label="Volume period"
              value={volumeView}
              onChange={setVolumeView}
              options={[
                { id: "daily", label: "Daily" },
                { id: "weekly", label: "Weekly" },
                { id: "monthly", label: "Monthly" },
              ]}
            />
          }
        />
        <div className="mt-5">
          <VolumeChart data={volumeData.map((d) => ({ ...d, volume: toDisplayVolume(d.volume, unit) }))} xKey="x" xFormat={volumeFormat} height={240} unit={unit} />
        </div>
      </section>

      {/* Muscle groups */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5 sm:p-7">
          <SectionTitle
            title="Muscle group balance"
            description="Sets per muscle group"
            action={<Segmented label="Muscle range" value={muscleRange} onChange={setMuscleRange} options={[{ id: "7", label: "7D" }, { id: "14", label: "14D" }, { id: "30", label: "30D" }]} />}
          />
          <div className="mt-6">
            <MuscleBars stats={muscles} />
          </div>
          <p className="mt-5 text-xs text-muted-foreground">Groups well below your average are flagged. This is a training-balance view, not medical advice.</p>
        </div>
        <div className="surface-card p-5 sm:p-7">
          <SectionTitle title="Distribution" description="Volume by muscle group" />
          <MuscleRadar data={muscles.filter((m) => m.muscle !== "core" || m.sets > 0).map((m) => ({ label: muscleGroups.find((g) => g.id === m.muscle)!.label, sets: m.sets }))} />
        </div>
      </section>

      {/* Consistency */}
      <section className="surface-card p-5 sm:p-7">
        <SectionTitle title="Weekly consistency" description={`Sessions per week vs your ${profile!.trainingDays}-day target`} />
        <ul className="mt-6 grid grid-cols-8 items-end gap-2" style={{ height: 140 }}>
          {weekly.map((w) => {
            const pct = Math.min(1, w.sessions / profile!.trainingDays);
            const met = w.sessions >= profile!.trainingDays;
            return (
              <li key={w.week} className="flex h-full flex-col items-center justify-end gap-2" aria-label={`Week of ${w.week}: ${w.sessions} sessions`}>
                <span className="num text-xs text-muted-foreground">{w.sessions}</span>
                <motion.span
                  className={cn("w-full max-w-10 origin-bottom rounded-lg", met ? "bg-brand" : "bg-foreground/15")}
                  style={{ height: `${Math.max(6, pct * 100)}%` }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 80, damping: 18 }}
                />
                <span className="text-[10px] text-muted-foreground">{format(fromDateKey(w.week), "d/M")}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
