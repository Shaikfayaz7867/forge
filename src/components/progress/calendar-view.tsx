"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DaySummaryCard } from "@/components/shared/day-summary";
import { PageHeader } from "@/components/shared/page-header";
import { useTargets, useToday } from "@/hooks/use-forge-derived";
import { fromDateKey, isoToDateKey, toDateKey } from "@/lib/dates";
import { daySummary } from "@/lib/summaries";
import { cn } from "@/lib/utils";
import { useForge } from "@/store/forge-store";

const INDICATORS = [
  { id: "workout", label: "Workout", className: "bg-brand" },
  { id: "nutrition", label: "Nutrition", className: "bg-carbs" },
  { id: "weight", label: "Weight", className: "bg-fat" },
] as const;

export function CalendarView() {
  const state = useForge();
  const today = useToday();
  const targets = useTargets();
  const [month, setMonth] = useState(() => startOfMonth(fromDateKey(today)));
  const [selected, setSelected] = useState(today);

  const sets = useMemo(
    () => ({
      workout: new Set(state.history.map((s) => isoToDateKey(s.startedAt))),
      nutrition: new Set(state.foodLogs.map((f) => f.date)),
      weight: new Set(state.weights.map((w) => w.date)),
    }),
    [state.history, state.foodLogs, state.weights],
  );

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const summary = daySummary(state, selected);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Calendar" title="Your month at a glance" description="Workouts, nutrition logs and weigh-ins. Select a day for its summary." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface-card p-4 sm:p-6" aria-label="Monthly calendar">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month">
              <ChevronLeft />
            </Button>
            <h2 className="text-sm font-semibold tracking-[0.12em] uppercase" aria-live="polite">
              {format(month, "MMMM yyyy")}
            </h2>
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))} disabled={isSameMonth(month, fromDateKey(today))} aria-label="Next month">
              <ChevronRight />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground" aria-hidden>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1" role="grid">
            {days.map((d) => {
              const k = toDateKey(d);
              const inMonth = isSameMonth(d, month);
              const future = k > today;
              const has = INDICATORS.filter((i) => sets[i.id].has(k));
              return (
                <button
                  key={k}
                  type="button"
                  role="gridcell"
                  disabled={future}
                  onClick={() => setSelected(k)}
                  aria-selected={selected === k}
                  aria-label={`${format(d, "MMMM d")}${has.length ? `: ${has.map((h) => h.label).join(", ")}` : ""}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl text-sm transition-colors sm:aspect-[1.15]",
                    !inMonth && "opacity-35",
                    future ? "text-muted-foreground/50" : "hover:bg-accent",
                    selected === k && "bg-foreground text-background hover:bg-foreground",
                    k === today && selected !== k && "ring-1 ring-foreground/40",
                  )}
                >
                  <span className="num">{format(d, "d")}</span>
                  <span className="flex h-1.5 gap-0.5" aria-hidden>
                    {has.map((h) => (
                      <span key={h.id} className={cn("size-1.5 rounded-full", h.className)} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <ul className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
            {INDICATORS.map((i) => (
              <li key={i.id} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", i.className)} aria-hidden />
                {i.label}
              </li>
            ))}
          </ul>
        </section>
        <section className="surface-card p-5 sm:p-6" aria-live="polite">
          <DaySummaryCard summary={summary} unit={state.settings.weightUnit} calorieTarget={targets?.calories} />
        </section>
      </div>
    </div>
  );
}
