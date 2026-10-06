"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Clock, Dumbbell, Layers, Repeat } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Segmented } from "@/components/shared/segmented";
import { fromDateKey, isoToDateKey, toDateKey } from "@/lib/dates";
import { formatMinutes } from "@/lib/dates";
import { formatVolume } from "@/lib/units";
import { useForge } from "@/store/forge-store";
import type { WorkoutCategory, WorkoutSession } from "@/lib/types";
import { sessionExercisesCompleted, sessionSetCount, sessionVolume } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "./category-badge";

type Filter = "all" | Extract<WorkoutCategory, "push" | "pull" | "legs" | "upper" | "lower">;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "legs", label: "Legs" },
  { id: "upper", label: "Upper" },
  { id: "lower", label: "Lower" },
];

const LEVEL_CLASS = [
  "bg-surface-2/60 text-muted-foreground",
  "bg-[color-mix(in_oklab,var(--brand),transparent_72%)]",
  "bg-[color-mix(in_oklab,var(--brand),transparent_45%)]",
  "bg-brand text-[#1a2a05]",
];

/** Monthly training heatmap. Colour intensity reflects that day's training volume. */
export function WorkoutCalendar({ history, today }: { history: WorkoutSession[]; today: string }) {
  const unit = useForge().settings.weightUnit;
  const [month, setMonth] = useState(() => startOfMonth(fromDateKey(today)));
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [dir, setDir] = useState(0);

  const byDay = useMemo(() => {
    const m = new Map<string, WorkoutSession[]>();
    for (const s of history) {
      if (filter !== "all" && s.category !== filter) continue;
      const k = isoToDateKey(s.startedAt);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [history, filter]);

  const maxVolume = useMemo(() => Math.max(1, ...[...byDay.values()].map((list) => list.reduce((a, s) => a + sessionVolume(s), 0))), [byDay]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  const monthCount = [...byDay.entries()].filter(([k]) => isSameMonth(fromDateKey(k), month)).length;
  const selectedSessions = selected ? byDay.get(selected) ?? [] : [];

  const shift = (n: number) => {
    setDir(n);
    setMonth((m) => addMonths(m, n));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <h3 className="min-w-36 text-center text-sm font-semibold tracking-[0.12em] uppercase" aria-live="polite">
            {format(month, "MMMM yyyy")}
          </h3>
          <Button variant="ghost" size="icon-sm" onClick={() => shift(1)} aria-label="Next month" disabled={isSameMonth(month, fromDateKey(today))}>
            <ChevronRight />
          </Button>
          <span className="num ml-2 text-xs text-muted-foreground">{monthCount} training days</span>
        </div>
        <Segmented label="Filter by workout type" value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground" aria-hidden>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={toDateKey(month) + filter}
          initial={{ opacity: 0, x: dir * 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-7 gap-1.5"
          role="grid"
          aria-label={`Workouts in ${format(month, "MMMM yyyy")}`}
        >
          {days.map((d) => {
            const k = toDateKey(d);
            const list = byDay.get(k);
            const inMonth = isSameMonth(d, month);
            const vol = list?.reduce((a, s) => a + sessionVolume(s), 0) ?? 0;
            const level = list ? Math.min(3, Math.max(1, Math.ceil((vol / maxVolume) * 3))) : 0;
            const isToday = k === today;
            const label = `${format(d, "MMMM d")}: ${list ? list.map((s) => s.name).join(", ") : "no workout"}`;
            return (
              <button
                key={k}
                type="button"
                role="gridcell"
                aria-label={label}
                disabled={!list}
                onClick={() => setSelected(k)}
                className={cn(
                  "num relative grid aspect-square place-items-center rounded-xl text-xs transition-transform sm:text-[13px]",
                  LEVEL_CLASS[level],
                  !inMonth && "opacity-30",
                  list && "hover:scale-[1.06] active:scale-95",
                  isToday && "ring-2 ring-foreground/60 ring-offset-2 ring-offset-surface",
                )}
              >
                {format(d, "d")}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
        Less
        {LEVEL_CLASS.map((c, i) => (
          <span key={i} className={cn("size-3 rounded-[4px]", c)} aria-hidden />
        ))}
        More volume
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected && format(fromDateKey(selected), "EEEE, MMMM d")}</DialogTitle>
            <DialogDescription>
              {selectedSessions.length} {selectedSessions.length === 1 ? "workout" : "workouts"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedSessions.map((s) => (
              <div key={s.id} className="rounded-2xl border bg-surface-2/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-semibold tracking-tight">{s.name}</p>
                  <CategoryBadge category={s.category} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    { icon: Clock, label: "Duration", v: formatMinutes(s.durationSec) },
                    { icon: Layers, label: "Exercises", v: sessionExercisesCompleted(s) },
                    { icon: Repeat, label: "Sets", v: sessionSetCount(s) },
                    { icon: Dumbbell, label: "Volume", v: formatVolume(sessionVolume(s), unit) },
                  ].map((x) => (
                    <div key={x.label} className="flex items-center gap-2">
                      <x.icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                      <dt className="sr-only">{x.label}</dt>
                      <dd className="num">{x.v}</dd>
                      <span className="text-muted-foreground">{x.label.toLowerCase()}</span>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <Button variant="outline" asChild>
            <Link href={`/history?type=workout&date=${selected ?? ""}`}>Open in history</Link>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
