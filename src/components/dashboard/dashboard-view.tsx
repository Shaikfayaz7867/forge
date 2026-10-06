"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { addDays, format } from "date-fns";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowRight, Check, Clock, Dumbbell, Flame, Layers, Play, Plus, Scale } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { ProgressRing } from "@/components/shared/progress-ring";
import { MacroBar } from "@/components/shared/macro-bar";
import { DeltaPill } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionTitle } from "@/components/shared/page-header";
import { InsightsList } from "@/components/shared/insights-list";
import { CaloriesChart, WeightChart } from "@/components/charts/charts";
import { WaterTracker } from "@/components/nutrition/water-tracker";
import { MuscleBars } from "@/components/progress/muscle-bars";
import { PRList } from "@/components/progress/pr-list";
import { CategoryBadge } from "@/components/workout/category-badge";
import { Button } from "@/components/ui/button";
import { useTargets, useToday } from "@/hooks/use-forge-derived";
import { calcBMI, bmiCategory } from "@/lib/calculations";
import { currentWeekKeys, formatMinutes, fromDateKey, greeting, isoToDateKey, lastNDays, toDateKey } from "@/lib/dates";
import { todayWorkout } from "@/lib/planning";
import { buildInsights, macrosByDay, weightTrendPerWeek } from "@/lib/summaries";
import { sumMacros } from "@/lib/nutrition";
import { formatNumber, formatVolume, formatWeight, toDisplayWeight } from "@/lib/units";
import {
  computePRs,
  dayStreak,
  muscleGroupStats,
  sessionExercisesCompleted,
  sessionSetCount,
  sessionVolume,
  weeklyStreak,
} from "@/lib/workout-stats";
import { cn } from "@/lib/utils";
import { forge, useForge } from "@/store/forge-store";

const card = "surface-card p-5 sm:p-6";

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, type: "spring" as const, stiffness: 160, damping: 22 } }),
};

function Reveal({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.section custom={i} variants={reveal} initial="hidden" animate="show" className={className}>
      {children}
    </motion.section>
  );
}

export function DashboardView() {
  const state = useForge();
  const { profile, plans, history, foodLogs, weights, settings, activeSession } = state;
  const targets = useTargets()!;
  const today = useToday();
  const router = useRouter();
  const unit = settings.weightUnit;

  const tw = useMemo(() => todayWorkout(plans, history, today), [plans, history, today]);
  const todayMacros = useMemo(() => sumMacros(foodLogs.filter((f) => f.date === today)), [foodLogs, today]);
  const weekKeys = useMemo(() => currentWeekKeys(fromDateKey(today)), [today]);
  const workoutDays = useMemo(() => new Set(history.map((s) => isoToDateKey(s.startedAt))), [history]);
  const weekSessions = useMemo(() => history.filter((s) => weekKeys.includes(isoToDateKey(s.startedAt))), [history, weekKeys]);
  const streakWeeks = useMemo(() => weeklyStreak(history, profile!.trainingDays), [history, profile]);
  const logStreak = useMemo(() => dayStreak(new Set(foodLogs.map((f) => f.date)), today), [foodLogs, today]);

  const last7 = useMemo(() => macrosByDay({ foodLogs }, lastNDays(7, fromDateKey(today))), [foodLogs, today]);
  const loggedDays = last7.filter((d) => d.logged);
  const avgProtein = loggedDays.length ? Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDays.length) : null;
  const avgCalories = loggedDays.length ? Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length) : null;

  const weight30 = useMemo(() => {
    const since = toDateKey(addDays(fromDateKey(today), -30));
    return weights.filter((w) => w.date >= since);
  }, [weights, today]);
  const currentWeight = weights.at(-1)?.weightKg ?? profile!.weightKg;
  const weightChange = weight30.length >= 2 ? currentWeight - weight30[0].weightKg : 0;
  const trend = weightTrendPerWeek(weight30);
  const bmi = calcBMI(currentWeight, profile!.heightCm);

  const prs = useMemo(() => computePRs(history).events.slice().reverse(), [history]);
  const muscles = useMemo(() => muscleGroupStats(history, toDateKey(addDays(fromDateKey(today), -14))), [history, today]);
  const insights = useMemo(() => buildInsights(state), [state]);

  const remaining = targets.calories - todayMacros.calories;
  const doneToday = tw.completed[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Greeting */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="eyebrow">{format(fromDateKey(today), "EEEE, d MMMM")}</p>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em] sm:text-[34px]">
            {greeting()}, {profile!.name} <span aria-hidden>👋</span>
          </h1>
          <p className="text-[15px] text-muted-foreground">
            {doneToday ? "Workout done. Focus on recovery and hitting your protein." : !tw.plan ? "Create your first workout plan to get started." : tw.isRestDay ? "Rest day — a good day to nail your nutrition." : "Ready for today's workout?"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            <span className="num font-medium">{weekSessions.length}</span>
            <span className="text-muted-foreground">/ {profile!.trainingDays} workouts this week</span>
          </span>
          {streakWeeks > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1.5">
              <span className="num font-medium">{streakWeeks}</span>
              <span className="text-muted-foreground">week streak</span>
            </span>
          )}
          {logStreak > 1 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1.5">
              <span className="num font-medium">{logStreak}</span>
              <span className="text-muted-foreground">days logged</span>
            </span>
          )}
        </div>
      </header>

      {settings.notifications.workoutReminders && tw.plan && !tw.isRestDay && !doneToday && !activeSession && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm">
          <span>
            Reminder: <strong className="font-medium">{tw.plan.name}</strong> is scheduled for today.
          </span>
          <Link href="/workouts" className="shrink-0 font-medium text-brand-ink underline-offset-4 hover:underline">
            View plan
          </Link>
        </div>
      )}

      {/* Level 1: Today's workout · Calories/Protein · Weight */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <Reveal i={0} className={cn(card, "flex flex-col xl:col-span-5")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] text-muted-foreground">{doneToday ? "Completed today" : tw.isRestDay ? "Rest day · next up" : "Today's workout"}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{doneToday?.name ?? tw.plan?.name ?? "No plan yet"}</h2>
            </div>
            {(doneToday ?? tw.plan) && <CategoryBadge category={(doneToday ?? tw.plan)!.category} />}
          </div>

          {doneToday ? (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Clock, label: "Duration", v: formatMinutes(doneToday.durationSec) },
                { icon: Layers, label: "Exercises", v: String(sessionExercisesCompleted(doneToday)) },
                { icon: Dumbbell, label: "Volume", v: formatVolume(sessionVolume(doneToday), unit) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-surface-2/70 p-3">
                  <s.icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                  <p className="num mt-3 text-lg font-semibold tracking-tight">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          ) : tw.plan ? (
            <ol className="mt-5 flex-1 space-y-1">
              {tw.plan.exercises.slice(0, 5).map((pe, i) => (
                <li key={pe.id} className="flex items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-sm">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="num w-4 text-xs text-muted-foreground">{i + 1}</span>
                    <span className="truncate">{exerciseById(getForgeState())[pe.exerciseId]?.name}</span>
                  </span>
                  <span className="num shrink-0 text-muted-foreground">
                    {pe.sets} × {pe.repMin === pe.repMax ? pe.repMax : `${pe.repMin}–${pe.repMax}`}
                    {pe.targetWeight ? ` · ${formatWeight(pe.targetWeight, unit)}` : ""}
                  </span>
                </li>
              ))}
              {tw.plan.exercises.length > 5 && (
                <li className="px-1 pt-1 text-xs text-muted-foreground">+{tw.plan.exercises.length - 5} more</li>
              )}
            </ol>
          ) : (
            <EmptyState compact icon={Dumbbell} title="No workouts yet." description="Your first workout is waiting." action={<Button asChild><Link href="/plans?new=1">Create Workout</Link></Button>} />
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {activeSession ? (
              <Button size="lg" variant="brand" asChild className="flex-1">
                <Link href="/session">
                  <Play data-icon="inline-start" /> Resume {activeSession.name}
                </Link>
              </Button>
            ) : doneToday ? (
              <Button size="lg" variant="outline" asChild className="flex-1">
                <Link href="/history">
                  View session <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : tw.plan ? (
              <Button
                size="lg"
                variant="brand"
                className="flex-1"
                onClick={() => {
                  forge.startSession(tw.plan);
                  router.push("/session");
                }}
              >
                <Play data-icon="inline-start" /> Start {tw.plan.name}
              </Button>
            ) : null}
            {tw.plan && !doneToday && !activeSession && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/workouts">Change</Link>
              </Button>
            )}
          </div>
        </Reveal>

        <Reveal i={1} className={cn(card, "xl:col-span-4")}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Today&apos;s nutrition</p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/nutrition?add=1">
                <Plus data-icon="inline-start" /> Log food
              </Link>
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={todayMacros.calories} max={targets.calories} size={132} stroke={11} label={`${Math.round(todayMacros.calories)} of ${targets.calories} kcal`}>
              <div>
                <AnimatedNumber value={todayMacros.calories} className="block text-[26px] leading-none font-semibold tracking-[-0.03em]" />
                <span className="mt-1 block text-[11px] text-muted-foreground">of {formatNumber(targets.calories)} kcal</span>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[13px] text-muted-foreground">{remaining >= 0 ? "Remaining" : "Over target"}</p>
              <p className="num text-2xl font-semibold tracking-tight">
                {formatNumber(Math.abs(remaining))}
                <span className="text-sm font-normal text-muted-foreground"> kcal</span>
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3.5">
            <MacroBar label="Protein" value={todayMacros.protein} target={targets.protein} color="var(--protein)" />
            <MacroBar label="Carbs" value={todayMacros.carbs} target={targets.carbs} color="var(--carbs)" />
            <MacroBar label="Fat" value={todayMacros.fat} target={targets.fat} color="var(--fat)" />
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 md:col-span-2 xl:col-span-3 xl:grid-cols-1">
          <Reveal i={2} className={card}>
            <Link href="/body" className="block rounded-xl focus-visible:outline-offset-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-muted-foreground">Current weight</p>
                <Scale className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mt-3 flex items-baseline gap-1">
                <AnimatedNumber value={toDisplayWeight(currentWeight, unit)} decimals={1} className="text-[30px] leading-none font-semibold tracking-[-0.03em]" />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                <DeltaPill
                  value={`${weightChange >= 0 ? "+" : "−"}${formatWeight(Math.abs(weightChange), unit)}`}
                  direction={Math.abs(weightChange) < 0.05 ? "flat" : weightChange > 0 ? "up" : "down"}
                  positive={["build_muscle", "gain_weight", "strength"].includes(profile!.goal) ? weightChange > 0 : profile!.goal === "lose_fat" ? weightChange < 0 : undefined}
                />
                30 days
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-[13px]">
                <span className="text-muted-foreground">BMI</span>
                <span className="num font-medium">
                  {bmi.toFixed(1)} <span className="font-normal text-muted-foreground">· {bmiCategory(bmi).label}</span>
                </span>
              </div>
            </Link>
          </Reveal>
          <Reveal i={3} className={card}>
            <WaterTracker date={today} compact />
          </Reveal>
        </div>
      </div>

      {/* Level 2: Weekly training · Weight trend · Nutrition trend */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <Reveal i={4} className={cn(card, "xl:col-span-4")}>
          <SectionTitle title="This week" description="Training consistency" action={<Link href="/review" className="text-[13px] text-muted-foreground hover:text-foreground">Weekly review</Link>} />
          <div className="mt-5 grid grid-cols-7 gap-1.5" role="list" aria-label="Workouts this week">
            {weekKeys.map((k) => {
              const done = workoutDays.has(k);
              const isToday = k === today;
              const future = k > today;
              return (
                <div key={k} role="listitem" className="flex flex-col items-center gap-2" aria-label={`${format(fromDateKey(k), "EEEE")}: ${done ? "trained" : future ? "upcoming" : "no workout"}`}>
                  <span className={cn("text-[11px] text-muted-foreground", isToday && "font-semibold text-foreground")}>{format(fromDateKey(k), "EEEEE")}</span>
                  <span
                    className={cn(
                      "grid aspect-square w-full max-w-10 place-items-center rounded-xl border",
                      done ? "border-transparent bg-brand text-[#1a2a05]" : future ? "border-dashed" : "bg-surface-2/60",
                      isToday && !done && "border-foreground/40",
                    )}
                  >
                    {done && <Check className="size-4" strokeWidth={2.5} aria-hidden />}
                  </span>
                </div>
              );
            })}
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3 border-t pt-4">
            <div>
              <dt className="text-xs text-muted-foreground">Workouts</dt>
              <dd className="num mt-0.5 text-lg font-semibold">{weekSessions.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sets</dt>
              <dd className="num mt-0.5 text-lg font-semibold">{weekSessions.reduce((s, x) => s + sessionSetCount(x), 0)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Volume</dt>
              <dd className="num mt-0.5 text-lg font-semibold">{formatVolume(weekSessions.reduce((s, x) => s + sessionVolume(x), 0), unit)}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal i={5} className={cn(card, "xl:col-span-4")}>
          <SectionTitle
            title="Weight trend"
            description={weight30.length >= 2 ? `${trend >= 0 ? "+" : "−"}${formatWeight(Math.abs(trend), unit, 2)} per week` : "Last 30 days"}
            action={<Link href="/body" className="text-[13px] text-muted-foreground hover:text-foreground">Details</Link>}
          />
          <div className="mt-4">
            {weight30.length >= 2 ? (
              <WeightChart data={weight30.map((w) => ({ date: w.date, value: toDisplayWeight(w.weightKg, unit) }))} unit={unit} height={188} />
            ) : (
              <EmptyState compact icon={Scale} title="No weight data yet." description="Add your first measurement." action={<Button size="sm" asChild><Link href="/body?log=weight">Log weight</Link></Button>} />
            )}
          </div>
        </Reveal>

        <Reveal i={6} className={cn(card, "md:col-span-2 xl:col-span-4")}>
          <SectionTitle
            title="Nutrition trend"
            description={avgCalories !== null ? `Avg ${formatNumber(avgCalories)} kcal · ${avgProtein}g protein` : "Last 7 days"}
            action={<Link href="/nutrition" className="text-[13px] text-muted-foreground hover:text-foreground">Details</Link>}
          />
          <div className="mt-4">
            {loggedDays.length ? (
              <CaloriesChart data={last7} target={targets.calories} height={188} />
            ) : (
              <EmptyState compact icon={Flame} title="Nothing logged yet." description="Start with your next meal." />
            )}
          </div>
        </Reveal>
      </div>

      {/* Level 3: PRs · Muscle groups · Insights */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <Reveal i={7} className={cn(card, "xl:col-span-4")}>
          <SectionTitle title="Recent PRs" action={<Link href="/progress#prs" className="text-[13px] text-muted-foreground hover:text-foreground">All records</Link>} />
          <div className="mt-4">
            {prs.length ? <PRList prs={prs} unit={unit} limit={4} /> : <EmptyState compact icon={Dumbbell} title="No PRs yet." description="Beat a previous best weight and it shows up here." />}
          </div>
        </Reveal>
        <Reveal i={8} className={cn(card, "xl:col-span-4")}>
          <SectionTitle title="Muscle groups" description="Sets in the last 14 days" />
          <div className="mt-5">
            {muscles.some((m) => m.sets > 0) ? <MuscleBars stats={muscles} /> : <EmptyState compact icon={Layers} title="No training data yet." description="Complete a workout to see your split." />}
          </div>
        </Reveal>
        <Reveal i={9} className={cn(card, "md:col-span-2 xl:col-span-4")}>
          <SectionTitle title="Insights" description="Based on your recent data" />
          <div className="mt-4">
            {insights.length ? <InsightsList insights={insights} limit={4} /> : <p className="text-sm text-muted-foreground">Log a few days of food and training to see insights.</p>}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
