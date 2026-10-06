"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { format } from "date-fns";
import { ArrowRight, Clock, Play, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { useToday } from "@/hooks/use-forge-derived";
import { formatMinutes, fromDateKey, isoToDateKey } from "@/lib/dates";
import { todayWorkout, WEEKDAY_SHORT } from "@/lib/planning";
import { formatVolume, formatWeight } from "@/lib/units";
import type { WorkoutPlan } from "@/lib/types";
import { previousPerformance, sessionSetCount, sessionVolume, sortByDate } from "@/lib/workout-stats";
import { forge, useForge } from "@/store/forge-store";
import { CategoryBadge } from "./category-badge";
import { WorkoutCalendar } from "./workout-calendar";

export function WorkoutsView() {
  const { plans, history, activeSession, settings } = useForge();
  const today = useToday();
  const router = useRouter();
  const unit = settings.weightUnit;
  const tw = useMemo(() => todayWorkout(plans, history, today), [plans, history, today]);
  const recent = useMemo(() => sortByDate(history).reverse().slice(0, 6), [history]);

  const start = (plan: WorkoutPlan | null) => {
    if (activeSession) {
      router.push("/session");
      return;
    }
    forge.startSession(plan);
    if (!plan) toast.message("Empty workout started", { description: "Add exercises as you go." });
    router.push("/session");
  };

  const hero = tw.plan;
  const doneToday = tw.completed.length > 0;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Workouts"
        title={doneToday ? "Trained today. Nice work." : hero ? `Today: ${hero.name}` : "What are you training today?"}
        description={tw.isRestDay && !doneToday ? "Nothing scheduled today. Here's what's next in your rotation." : undefined}
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => start(null)}>
              <Zap data-icon="inline-start" /> Empty workout
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/plans">Manage plans</Link>
            </Button>
          </>
        }
      />

      {activeSession && (
        <div className="surface-card flex flex-col gap-4 border-brand/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] text-muted-foreground">In progress</p>
            <p className="text-lg font-semibold">{activeSession.name}</p>
          </div>
          <Button variant="brand" size="lg" asChild>
            <Link href="/session">
              <Play data-icon="inline-start" /> Resume workout
            </Link>
          </Button>
        </div>
      )}

      {hero ? (
        <section className="surface-card overflow-hidden" aria-labelledby="today-plan">
          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <CategoryBadge category={hero.category} />
                {tw.isRestDay && <span className="text-xs text-muted-foreground">Next up</span>}
              </div>
              <h2 id="today-plan" className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
                {hero.name}
              </h2>
              <ol className="mt-5 divide-y">
                {hero.exercises.map((pe, i) => {
                  const prev = previousPerformance(history, pe.exerciseId);
                  const top = prev?.sets.reduce((a, b) => (b.weight > a.weight ? b : a), prev.sets[0]);
                  return (
                    <li key={pe.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-3">
                      <span className="num text-xs text-muted-foreground">{i + 1}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{exerciseById(getForgeState())[pe.exerciseId]?.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {top ? `Last: ${formatWeight(top.weight, unit)} × ${top.reps}` : "No previous data"}
                        </span>
                      </span>
                      <span className="num text-right text-sm text-muted-foreground">
                        {pe.sets} × {pe.repMin === pe.repMax ? pe.repMax : `${pe.repMin}–${pe.repMax}`}
                        {pe.targetWeight ? <span className="block text-xs">{formatWeight(pe.targetWeight, unit)}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="flex flex-col justify-between gap-6 border-t bg-surface-2/40 p-5 sm:p-7 lg:border-t-0 lg:border-l">
              <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                <div>
                  <dt className="text-xs text-muted-foreground">Exercises</dt>
                  <dd className="num text-2xl font-semibold">{hero.exercises.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Sets</dt>
                  <dd className="num text-2xl font-semibold">{hero.exercises.reduce((s, e) => s + e.sets, 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Est. time</dt>
                  <dd className="num text-2xl font-semibold">
                    {Math.round(hero.exercises.reduce((s, e) => s + e.sets * (e.restSec + 45), 0) / 60)}m
                  </dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2">
                <Button size="lg" variant="brand" onClick={() => start(hero)} disabled={!!activeSession}>
                  <Play data-icon="inline-start" /> Start workout
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link href={`/plans?edit=${hero.id}`}>Edit plan</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="surface-card">
          <EmptyState
            icon={Plus}
            title="No workouts yet."
            description="Your first workout is waiting."
            action={
              <Button asChild>
                <Link href="/plans?new=1">Create Workout</Link>
              </Button>
            }
          />
        </div>
      )}

      {plans.length > 1 && (
        <section className="space-y-4">
          <SectionTitle title="Other plans" action={<Link href="/plans" className="text-[13px] text-muted-foreground hover:text-foreground">All plans</Link>} />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
            {plans
              .filter((p) => p.id !== hero?.id)
              .map((p) => (
                <div key={p.id} className="flex w-[260px] shrink-0 snap-start items-center justify-between gap-3 rounded-2xl border bg-surface p-4 sm:w-auto">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.exercises.length} exercises
                      {p.scheduledDays.length > 0 && ` · ${[1, 2, 3, 4, 5, 6, 0].filter((d) => p.scheduledDays.includes(d)).map((d) => WEEKDAY_SHORT[d]).join(", ")}`}
                    </p>
                  </div>
                  <Button size="icon" variant="outline" onClick={() => start(p)} aria-label={`Start ${p.name}`} disabled={!!activeSession}>
                    <Play />
                  </Button>
                </div>
              ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Training calendar" description="Tap a day to see what you did" />
          <div className="mt-5">
            <WorkoutCalendar history={history} today={today} />
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Recent sessions" action={<Link href="/history?type=workout" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">History <ArrowRight className="size-3.5" /></Link>} />
          {recent.length ? (
            <ul className="mt-4 divide-y">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(fromDateKey(isoToDateKey(s.startedAt)), "EEE, MMM d")} · <Clock className="inline size-3" aria-hidden /> {formatMinutes(s.durationSec)}
                    </p>
                  </div>
                  <div className="num text-right text-sm">
                    <p>{formatVolume(sessionVolume(s), unit)}</p>
                    <p className="text-xs text-muted-foreground">{sessionSetCount(s)} sets</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Clock} title="No sessions logged" description="Finished workouts appear here." />
          )}
        </section>
      </div>
    </div>
  );
}
