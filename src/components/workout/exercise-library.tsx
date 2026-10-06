"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { muscleGroups } from "@/data/constants";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { ExerciseImage } from "@/components/shared/exercise-image";
import { StatCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Segmented } from "@/components/shared/segmented";
import { ExerciseProgressChart } from "@/components/charts/charts";
import { formatVolume, formatWeight, toDisplayWeight } from "@/lib/units";
import type { Exercise, MuscleGroup } from "@/lib/types";
import { exerciseSummary, exerciseTimeline } from "@/lib/workout-stats";
import { useForge } from "@/store/forge-store";

type Filter = "all" | MuscleGroup;

function ExerciseCard({ exercise, index, onOpen, sessions }: { exercise: Exercise; index: number; onOpen: () => void; sessions: number }) {
  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 12) * 0.03, type: "spring", stiffness: 220, damping: 24 }}>
      <button
        type="button"
        onClick={onOpen}
        className="group surface-card block w-full overflow-hidden text-left transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-(--shadow-lift)"
      >
        <div className="relative">
          <ExerciseImage exercise={exercise} className="aspect-[4/3] w-full" />
          {/* Hover reveal: key info slides up over the image */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            <p className="line-clamp-2 text-xs leading-relaxed">{exercise.tips[0]}</p>
          </div>
          {sessions > 0 && (
            <span className="num absolute top-2.5 right-2.5 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              {sessions}× logged
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="font-medium">{exercise.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {exercise.muscleGroup} · {exercise.equipment} · {exercise.difficulty}
          </p>
        </div>
      </button>
    </motion.li>
  );
}

export function ExerciseLibrary() {
  const { history, settings } = useForge();
  const unit = settings.weightUnit;
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const openId = params.get("id");
  const open = openId ? exerciseById(getForgeState())[openId] : null;

  const sessionsById = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of history) for (const e of s.exercises) m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1);
    return m;
  }, [history]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const stateExercises = getForgeState().exercises;
    return stateExercises.filter(
      (e) =>
        (filter === "all" || e.muscleGroup === filter) &&
        (!q || [e.name, e.equipment, e.muscleGroup, ...e.secondaryMuscles].some((t) => t.toLowerCase().includes(q))),
    );
  }, [query, filter]);

  const summary = open ? exerciseSummary(history, open.id) : null;
  const timeline = open ? exerciseTimeline(history, open.id) : [];

  const setOpen = (id: string | null) => router.replace(id ? `/exercises?id=${id}` : "/exercises", { scroll: false });

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Library" title="Exercises" description={`${(getForgeState().exercises).length} movements with instructions, form tips and your personal history.`} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, equipment, muscle" className="pl-10" aria-label="Search exercises" />
        </div>
        <Segmented label="Muscle group" value={filter} onChange={setFilter} options={[{ id: "all", label: "All" }, ...muscleGroups.map((m) => ({ id: m.id, label: m.label }))]} />
      </div>

      {list.length ? (
        <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e, i) => (
            <ExerciseCard key={e.id} exercise={e} index={i} onOpen={() => setOpen(e.id)} sessions={sessionsById.get(e.id) ?? 0} />
          ))}
        </ul>
      ) : (
        <div className="surface-card">
          <EmptyState icon={Search} title={`No exercises match “${query}”`} description="Try a different name, or clear the muscle filter." />
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg!">
          {open && summary && (
            <>
              <ExerciseImage exercise={open} className="aspect-[16/10] w-full" />
              <SheetHeader className="px-6 pt-5">
                <SheetTitle className="text-2xl tracking-tight">{open.name}</SheetTitle>
                <SheetDescription className="capitalize">
                  {open.muscleGroup}
                  {open.secondaryMuscles.length ? ` · ${open.secondaryMuscles.join(", ")}` : ""} · {open.equipment} · {open.difficulty}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-7 px-6 pt-4 pb-10">
                {summary.sessions > 0 ? (
                  <section className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 rounded-2xl border p-4 sm:grid-cols-4">
                      <StatCard label="Max weight" value={formatWeight(summary.maxWeight, unit)} />
                      <StatCard label="Est. 1RM" value={formatWeight(summary.best1RM, unit)} />
                      <StatCard label="Best reps" value={summary.bestReps} />
                      <StatCard label="Sessions" value={summary.sessions} sub={`${formatVolume(summary.totalVolume, unit)} total`} />
                    </div>
                    {timeline.length >= 2 && (
                      <ExerciseProgressChart data={timeline.map((p) => ({ date: p.date, value: toDisplayWeight(p.maxWeight, unit) }))} dataKey="value" label="Top set" unit={unit} height={180} />
                    )}
                  </section>
                ) : (
                  <p className="rounded-2xl bg-surface-2/60 p-4 text-sm text-muted-foreground">You haven&apos;t logged this exercise yet. Add it to a plan to start tracking progress.</p>
                )}
                <section>
                  <h3 className="mb-3 text-sm font-semibold">How to</h3>
                  <ol className="space-y-3">
                    {open.instructions.map((s, i) => (
                      <li key={s} className="flex gap-3 text-sm leading-relaxed">
                        <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-medium">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold">Tips</h3>
                  <ul className="space-y-2 rounded-2xl border-l-2 border-brand pl-4 text-sm text-muted-foreground">
                    {open.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </section>
                <p className="text-xs text-muted-foreground">Exercise photos: free-exercise-db, public domain.</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
