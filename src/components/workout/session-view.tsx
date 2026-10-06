"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  MoreVertical,
  Plus,
  StickyNote,
  Timer,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ExerciseImage } from "@/components/shared/exercise-image";
import { LogoMark } from "@/components/shared/logo";
import { useNow } from "@/hooks/use-forge-derived";
import { formatDuration, formatMinutes } from "@/lib/dates";
import { uid } from "@/lib/ids";
import { formatVolume, formatWeight, fromDisplayWeight, toDisplayWeight } from "@/lib/units";
import type { ActiveSession, LoggedExercise, WeightUnit, WorkoutSession } from "@/lib/types";
import { previousPerformance, sessionSetCount, sessionVolume, type PREvent } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";
import { forge, useForge } from "@/store/forge-store";
import { ExercisePicker } from "./exercise-picker";
import { RestTimer, type RestState } from "./rest-timer";

/** Numeric input that keeps its own text while typing and commits valid numbers. */
function SetNumberInput({
  value,
  onCommit,
  label,
  step,
  max,
  done,
}: {
  value: number;
  onCommit: (n: number) => void;
  label: string;
  step: number;
  max: number;
  done: boolean;
}) {
  const [text, setText] = useState(String(value));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(String(value));
  }
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={0}
      max={max}
      aria-label={label}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        if (!Number.isNaN(n) && n >= 0 && n <= max) onCommit(n);
      }}
      onBlur={() => setText(String(value))}
      className={cn(
        "num h-12 w-full min-w-0 rounded-xl border bg-surface text-center text-[17px] font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        done && "border-transparent bg-transparent",
      )}
    />
  );
}

function ExercisePanel({
  ex,
  index,
  unit,
  history,
  sessionId,
  onCompleteSet,
}: {
  ex: LoggedExercise;
  index: number;
  unit: WeightUnit;
  history: WorkoutSession[];
  sessionId: string;
  onCompleteSet: (exerciseIndex: number, setIndex: number) => void;
}) {
  const meta = exerciseById(getForgeState())[ex.exerciseId];
  const prev = useMemo(() => previousPerformance(history, ex.exerciseId, sessionId), [history, ex.exerciseId, sessionId]);
  const [notesOpen, setNotesOpen] = useState(!!ex.notes);
  const [infoOpen, setInfoOpen] = useState(false);

  const patchExercise = (patch: Partial<LoggedExercise>) =>
    forge.updateSession((s) => ({ ...s, exercises: s.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));

  const patchSet = (setIndex: number, patch: Partial<LoggedExercise["sets"][number]>) =>
    patchExercise({ sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)) });

  const addSet = () => {
    const last = ex.sets.at(-1);
    patchExercise({ sets: [...ex.sets, { id: uid("set"), weight: last?.weight ?? 0, reps: last?.reps ?? 10, completed: false }] });
  };

  const deleteSet = (setIndex: number) => {
    if (ex.sets.length === 1) {
      toast.error("An exercise needs at least one set", { description: "Remove the exercise from the menu instead." });
      return;
    }
    patchExercise({ sets: ex.sets.filter((_, i) => i !== setIndex) });
  };

  if (!meta) return null;

  return (
    <section className="space-y-5" aria-labelledby={`ex-${ex.id}`}>
      <div className="flex items-start gap-4">
        <ExerciseImage exercise={meta} className="size-16 shrink-0 rounded-2xl sm:size-20" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground capitalize">
            {meta.muscleGroup} · {meta.equipment}
          </p>
          <h2 id={`ex-${ex.id}`} className="mt-0.5 text-2xl leading-tight font-semibold tracking-[-0.02em]">
            {meta.name}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {prev ? (
              <>
                Last time: <span className="num text-foreground">{prev.sets.map((s) => `${toDisplayWeight(s.weight, unit)}×${s.reps}`).join(", ")}</span>
              </>
            ) : (
              "First time logging this exercise"
            )}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setInfoOpen(true)} aria-label={`How to do ${meta.name}`}>
          <Info />
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-surface">
        <div className="grid grid-cols-[40px_1fr_1fr_52px_36px] items-center gap-2 border-b px-3 py-2 text-[11px] tracking-wide text-muted-foreground uppercase sm:grid-cols-[48px_90px_1fr_1fr_56px_40px]">
          <span>Set</span>
          <span className="hidden sm:block">Previous</span>
          <span className="text-center">{unit}</span>
          <span className="text-center">Reps</span>
          <span className="sr-only">Done</span>
          <span className="sr-only">Delete</span>
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {ex.sets.map((set, si) => {
              const p = prev?.sets[si];
              return (
                <motion.li
                  key={set.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 36 }}
                  className={cn(
                    "grid grid-cols-[40px_1fr_1fr_52px_36px] items-center gap-2 border-b px-3 py-2 transition-colors last:border-b-0 sm:grid-cols-[48px_90px_1fr_1fr_56px_40px]",
                    set.completed && "bg-brand-soft",
                  )}
                >
                  <span className="num text-sm font-semibold text-muted-foreground">{si + 1}</span>
                  <span className="num hidden text-sm text-muted-foreground sm:block">{p ? `${toDisplayWeight(p.weight, unit)} × ${p.reps}` : "—"}</span>
                  <SetNumberInput
                    label={`Set ${si + 1} weight in ${unit}`}
                    value={toDisplayWeight(set.weight, unit)}
                    step={unit === "kg" ? 2.5 : 5}
                    max={1000}
                    done={set.completed}
                    onCommit={(n) => patchSet(si, { weight: Math.round(fromDisplayWeight(n, unit) * 100) / 100 })}
                  />
                  <SetNumberInput label={`Set ${si + 1} reps`} value={set.reps} step={1} max={200} done={set.completed} onCommit={(n) => patchSet(si, { reps: Math.round(n) })} />
                  <button
                    type="button"
                    onClick={() => (set.completed ? patchSet(si, { completed: false }) : onCompleteSet(index, si))}
                    aria-pressed={set.completed}
                    aria-label={set.completed ? `Mark set ${si + 1} incomplete` : `Complete set ${si + 1}`}
                    className={cn(
                      "grid size-12 place-items-center rounded-xl border transition-colors active:scale-95",
                      set.completed ? "border-transparent bg-brand text-[#1a2a05]" : "bg-surface-2/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <motion.span key={String(set.completed)} initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                      <Check className="size-5" strokeWidth={set.completed ? 3 : 2} />
                    </motion.span>
                  </button>
                  <button type="button" onClick={() => deleteSet(si)} aria-label={`Delete set ${si + 1}`} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        <div className="flex items-center gap-2 border-t p-2">
          <Button variant="ghost" className="flex-1" onClick={addSet}>
            <Plus data-icon="inline-start" /> Add set
          </Button>
          <Button variant="ghost" onClick={() => setNotesOpen((o) => !o)} aria-expanded={notesOpen}>
            <StickyNote data-icon="inline-start" /> Notes
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {notesOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Textarea
              value={ex.notes}
              onChange={(e) => patchExercise({ notes: e.target.value })}
              placeholder="Seat height, grip, how it felt…"
              aria-label={`Notes for ${meta.name}`}
              rows={2}
              maxLength={300}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md!">
          <SheetHeader>
            <SheetTitle>{meta.name}</SheetTitle>
            <SheetDescription className="capitalize">
              {meta.muscleGroup} · {meta.secondaryMuscles.join(", ") || "isolation"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-8">
            <ExerciseImage exercise={meta} className="aspect-[4/3] w-full rounded-2xl" />
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
              {meta.instructions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <ul className="space-y-2 rounded-2xl bg-surface-2/60 p-4 text-sm">
              {meta.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function Celebration({ result, unit, onDone }: { result: { session: WorkoutSession; prs: PREvent[] }; unit: WeightUnit; onDone: () => void }) {
  const { session, prs } = result;
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: (Math.cos((i / 22) * Math.PI * 2) * (90 + (i % 4) * 30)) | 0,
        y: (Math.sin((i / 22) * Math.PI * 2) * (90 + (i % 3) * 30)) | 0,
        c: ["var(--brand)", "var(--carbs)", "var(--fat)", "var(--foreground)"][i % 4],
      })),
    [],
  );
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-5 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="done-title"
    >
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute top-16 left-1/2" aria-hidden>
          {particles.map((p, i) => (
            <motion.span
              key={i}
              className="absolute size-1.5 rounded-full"
              style={{ background: p.c }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            />
          ))}
        </div>
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="surface-card relative overflow-hidden p-6 text-center sm:p-8"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
            className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-[#1a2a05]"
          >
            <Check className="size-8" strokeWidth={3} />
          </motion.span>
          <h2 id="done-title" className="mt-5 text-2xl font-semibold tracking-tight">
            {session.name} complete
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Saved to your history.</p>
          <dl className="mt-6 grid grid-cols-3 gap-2">
            {[
              { l: "Duration", v: formatMinutes(session.durationSec) },
              { l: "Sets", v: String(sessionSetCount(session)) },
              { l: "Volume", v: formatVolume(sessionVolume(session), unit) },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-surface-2/60 p-3">
                <dt className="text-[11px] text-muted-foreground">{x.l}</dt>
                <dd className="num mt-1 font-semibold">{x.v}</dd>
              </div>
            ))}
          </dl>
          {prs.length > 0 && (
            <div className="mt-5 space-y-2 text-left">
              <p className="text-center text-xs font-medium tracking-[0.14em] text-brand-ink uppercase">
                {prs.length} new personal {prs.length === 1 ? "record" : "records"}
              </p>
              {prs.map((pr, i) => (
                <motion.div
                  key={pr.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.12, type: "spring", stiffness: 260, damping: 22 }}
                  className="flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand-soft p-3"
                >
                  <Trophy className="size-5 text-brand-ink" strokeWidth={1.75} aria-hidden />
                  <span className="flex-1 text-sm font-medium">{exerciseById(getForgeState())[pr.exerciseId]?.name}</span>
                  <span className="num text-sm">
                    {formatWeight(pr.previous, unit)} → <strong>{formatWeight(pr.weight, unit)}</strong>
                  </span>
                </motion.div>
              ))}
            </div>
          )}
          <div className="mt-7 grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" asChild>
              <Link href="/progress">View progress</Link>
            </Button>
            <Button size="lg" onClick={onDone}>
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function SessionView() {
  const { hydrated, profile, activeSession, history, settings } = useForge();
  const router = useRouter();
  const now = useNow(1000);
  const [rest, setRest] = useState<RestState | null>(null);
  const [picker, setPicker] = useState(false);
  const [timerSheet, setTimerSheet] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [result, setResult] = useState<{ session: WorkoutSession; prs: PREvent[] } | null>(null);
  const unit = settings.weightUnit;

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  const session = activeSession;
  const current = session ? Math.min(session.currentExerciseIndex, Math.max(0, session.exercises.length - 1)) : 0;
  const setCurrent = (i: number) => forge.updateSession((s) => ({ ...s, currentExerciseIndex: i }));

  const completeSet = useCallback(
    (exIndex: number, setIndex: number) => {
      const s = session;
      if (!s) return;
      const set = s.exercises[exIndex]?.sets[setIndex];
      if (!set) return;
      if (set.reps <= 0) {
        toast.error("Enter your reps before completing the set");
        return;
      }
      forge.updateSession((x: ActiveSession) => ({
        ...x,
        exercises: x.exercises.map((e, i) =>
          i === exIndex ? { ...e, sets: e.sets.map((st, j) => (j === setIndex ? { ...st, completed: true } : st)) } : e,
        ),
      }));
      navigator.vibrate?.(30);
      const restSec = s.exercises[exIndex].restSec || settings.defaultRestSec;
      if (restSec > 0) setRest({ endsAt: Date.now() + restSec * 1000, total: restSec });
    },
    [session, settings.defaultRestSec],
  );

  if (!hydrated) return <div className="min-h-dvh" aria-busy="true" />;

  if (result) {
    return <Celebration result={result} unit={unit} onDone={() => router.push("/dashboard")} />;
  }

  if (!session) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <EmptyState
          icon={Timer}
          title="No workout in progress"
          description="Start a workout from your plans or begin an empty session."
          action={
            <Button asChild>
              <Link href="/workouts">Go to workouts</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const elapsed = Math.max(0, Math.floor((now - Date.parse(session.startedAt)) / 1000));
  const ex = session.exercises[current];
  const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0);
  const doneSets = session.exercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0);
  const liveVolume = sessionVolume(session);
  const nextSetIndex = ex ? ex.sets.findIndex((s) => !s.completed) : -1;

  const primaryAction = () => {
    if (!ex) return setPicker(true);
    if (nextSetIndex >= 0) return completeSet(current, nextSetIndex);
    const nextEx = session.exercises.findIndex((e, i) => i > current && e.sets.some((s) => !s.completed));
    if (nextEx >= 0) setCurrent(nextEx);
    else requestFinish();
  };

  const primaryLabel = !ex
    ? "Add an exercise"
    : nextSetIndex >= 0
      ? `Complete set ${nextSetIndex + 1}`
      : session.exercises.some((e, i) => i > current && e.sets.some((s) => !s.completed))
        ? "Next exercise"
        : "All sets done · Finish";

  const finish = async () => {
    if (doneSets === 0) {
      toast.error("Complete at least one set before finishing", { description: "Or discard this workout from the menu." });
      return;
    }
    const r = await forge.finishSession();
    if (!r) return;
    setRest(null);
    setResult({ session: r.session, prs: settings.notifications.prCelebrations ? r.prs : [] });
  };

  const requestFinish = () => {
    if (doneSets === 0) return finish();
    if (doneSets < totalSets) setConfirmFinish(true);
    else finish();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Button variant="ghost" size="icon" asChild aria-label="Minimise workout">
            <Link href="/dashboard">
              <ChevronLeft />
            </Link>
          </Button>
          <LogoMark className="hidden size-6 sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{session.name}</p>
            <p className="num text-xs text-muted-foreground" aria-live="off">
              Elapsed {formatDuration(elapsed)} · {doneSets}/{totalSets} sets
            </p>
          </div>
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setTimerSheet(true)} aria-label="Rest timer">
            <Timer />
          </Button>
          <Button variant="brand" className="hidden sm:inline-flex" onClick={requestFinish}>
            Finish workout
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Workout options">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setPicker(true)}>
                <Plus /> Add exercise
              </DropdownMenuItem>
              {ex && (
                <DropdownMenuItem
                  onSelect={() =>
                    forge.updateSession((s) => ({
                      ...s,
                      exercises: s.exercises.filter((_, i) => i !== current),
                      currentExerciseIndex: Math.max(0, current - 1),
                    }))
                  }
                >
                  <X /> Remove {exerciseById(getForgeState())[ex.exerciseId]?.name}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDiscard(true)}>
                <Trash2 /> Discard workout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="h-0.5 bg-muted" aria-hidden>
          <motion.div className="h-full origin-left bg-brand" animate={{ scaleX: totalSets ? doneSets / totalSets : 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
        </div>
        {/* Exercise chips */}
        <nav aria-label="Exercises in this workout" className="mx-auto max-w-6xl">
          <ol className="flex gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-none sm:px-6">
            {session.exercises.map((e, i) => {
              const done = e.sets.length > 0 && e.sets.every((s) => s.completed);
              const active = i === current;
              return (
                <li key={e.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] whitespace-nowrap transition-colors",
                      active ? "border-foreground bg-foreground text-background" : done ? "border-transparent bg-brand-soft text-brand-ink" : "bg-surface text-muted-foreground",
                    )}
                  >
                    {done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                    {exerciseById(getForgeState())[e.exerciseId]?.name}
                  </button>
                </li>
              );
            })}
            <li className="shrink-0">
              <button type="button" onClick={() => setPicker(true)} className="flex h-9 items-center gap-1 rounded-full border border-dashed px-3 text-[13px] text-muted-foreground hover:text-foreground">
                <Plus className="size-3.5" aria-hidden /> Add
              </button>
            </li>
          </ol>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 pt-6 pb-44 sm:px-6 lg:grid-cols-[1fr_320px] lg:pb-12">
        <div>
          <AnimatePresence mode="wait" initial={false}>
            {ex ? (
              <motion.div key={ex.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                <ExercisePanel ex={ex} index={current} unit={unit} history={history} sessionId={session.id} onCompleteSet={completeSet} />
              </motion.div>
            ) : (
              <EmptyState icon={Plus} title="Empty workout" description="Add your first exercise to start logging sets." action={<Button onClick={() => setPicker(true)}>Add exercise</Button>} />
            )}
          </AnimatePresence>
          {session.exercises.length > 1 && (
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
                <ChevronLeft data-icon="inline-start" /> Previous
              </Button>
              <Button variant="ghost" disabled={current >= session.exercises.length - 1} onClick={() => setCurrent(current + 1)}>
                Next <ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          )}
        </div>

        {/* Desktop side panel */}
        <aside className="hidden space-y-4 lg:block">
          <div className="surface-card p-5">
            <RestTimer rest={rest} onChange={setRest} sound={settings.notifications.restTimerSound} />
          </div>
          <div className="surface-card p-5">
            <p className="text-sm font-medium">Session</p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Volume</dt>
                <dd className="num text-lg font-semibold">{formatVolume(liveVolume, unit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sets done</dt>
                <dd className="num text-lg font-semibold">
                  {doneSets}/{totalSets}
                </dd>
              </div>
            </dl>
            <Button variant="brand" size="lg" className="mt-5 w-full" onClick={requestFinish}>
              Finish workout
            </Button>
          </div>
        </aside>
      </main>

      {/* Mobile sticky action area */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/92 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <RestTimer rest={rest} onChange={setRest} sound={settings.notifications.restTimerSound} variant="bar" className="mb-3" />
        <div className="flex gap-2">
          <Button size="lg" className="h-14 flex-1 text-base" onClick={primaryAction}>
            {nextSetIndex >= 0 && <Check data-icon="inline-start" className="size-5" />}
            {primaryLabel}
          </Button>
          <Button size="lg" variant="brand" className="h-14 px-5" onClick={requestFinish}>
            Finish
          </Button>
        </div>
      </div>

      <Sheet open={timerSheet} onOpenChange={setTimerSheet}>
        <SheetContent side="bottom" className="rounded-t-[28px] px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <div className="mx-auto h-1 w-10 rounded-full bg-border" aria-hidden />
          <SheetHeader className="px-0">
            <SheetTitle>Rest timer</SheetTitle>
            <SheetDescription>Pick a duration. It also starts automatically after each set.</SheetDescription>
          </SheetHeader>
          <RestTimer rest={rest} onChange={setRest} sound={settings.notifications.restTimerSound} />
        </SheetContent>
      </Sheet>

      <ExercisePicker
        open={picker}
        onOpenChange={setPicker}
        excludeIds={session.exercises.map((e) => e.exerciseId)}
        onSelect={(exerciseId) => {
          const prev = previousPerformance(history, exerciseId);
          forge.updateSession((s) => ({
            ...s,
            currentExerciseIndex: s.exercises.length,
            exercises: [
              ...s.exercises,
              {
                id: uid("le"),
                exerciseId,
                notes: "",
                restSec: settings.defaultRestSec,
                sets: (prev?.sets.length ? prev.sets : [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }]).map((p) => ({
                  id: uid("set"),
                  weight: p.weight,
                  reps: p.reps,
                  completed: false,
                })),
              },
            ],
          }));
        }}
      />

      <ConfirmDialog
        open={confirmFinish}
        onOpenChange={setConfirmFinish}
        title="Finish workout?"
        description={
          doneSets < totalSets
            ? `${totalSets - doneSets} ${totalSets - doneSets === 1 ? "set isn't" : "sets aren't"} marked complete. Unfinished sets won't be saved.`
            : "Save this workout to your history."
        }
        confirmLabel="Finish & save"
        onConfirm={finish}
      />
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard this workout?"
        description="Nothing from this session will be saved."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          forge.cancelSession();
          toast("Workout discarded");
          router.push("/workouts");
        }}
      />
    </div>
  );
}
