"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { format } from "date-fns";
import { ArrowDownUp, Dumbbell, History, Ruler, Scale, Trash2, Trophy, Utensils } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Segmented } from "@/components/shared/segmented";
import { MEASUREMENTS } from "@/data/constants";
import { formatMinutes, fromDateKey, isoToDateKey } from "@/lib/dates";
import { formatServing, mealLabel } from "@/lib/nutrition";
import { formatLength, formatVolume, formatWeight } from "@/lib/units";
import { computePRs, sessionSetCount, sessionVolume } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/lib/types";
import { useForge, forge } from "@/store/forge-store";

type Filter = "all" | "workout" | "food" | "weight" | "measurements" | "prs";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "workout", label: "Workout" },
  { id: "food", label: "Food" },
  { id: "weight", label: "Weight" },
  { id: "measurements", label: "Measurements" },
  { id: "prs", label: "PRs" },
];

interface Row {
  id: string;
  type: Exclude<Filter, "all">;
  date: string;
  sortKey: string;
  title: string;
  detail: string;
  value?: string;
  session?: WorkoutSession;
}

const ICONS = { workout: Dumbbell, food: Utensils, weight: Scale, measurements: Ruler, prs: Trophy };

export function HistoryView() {
  const { history, foodLogs, weights, measurements, settings } = useForge();
  const params = useSearchParams();
  const initialType = (params.get("type") as Filter) || "all";
  const [filter, setFilter] = useState<Filter>(FILTERS.some((f) => f.id === initialType) ? initialType : "all");
  const [desc, setDesc] = useState(true);
  const [limit, setLimit] = useState(60);
  const [toDelete, setToDelete] = useState<WorkoutSession | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const unit = settings.weightUnit;

  const rows = useMemo(() => {
    const out: Row[] = [];
    if (filter === "all" || filter === "workout")
      for (const s of history)
        out.push({
          id: s.id,
          type: "workout",
          date: isoToDateKey(s.startedAt),
          sortKey: s.startedAt,
          title: s.name,
          detail: `${formatMinutes(s.durationSec)} · ${s.exercises.length} exercises · ${sessionSetCount(s)} sets`,
          value: formatVolume(sessionVolume(s), unit),
          session: s,
        });
    if (filter === "all" || filter === "food")
      for (const f of foodLogs)
        out.push({ id: f.id, type: "food", date: f.date, sortKey: `${f.date}T${f.time}`, title: f.foodName, detail: `${mealLabel(f.meal)} · ${formatServing(f)}`, value: `${f.calories} kcal` });
    if (filter === "all" || filter === "weight")
      for (const w of weights) out.push({ id: w.id, type: "weight", date: w.date, sortKey: `${w.date}T07:00`, title: "Weigh-in", detail: "Body weight", value: formatWeight(w.weightKg, unit) });
    if (filter === "all" || filter === "measurements")
      for (const m of measurements)
        out.push({
          id: m.id,
          type: "measurements",
          date: m.date,
          sortKey: `${m.date}T07:01`,
          title: "Measurements",
          detail: MEASUREMENTS.filter((x) => m.values[x.id] !== undefined).map((x) => `${x.label} ${formatLength(m.values[x.id]!, settings.heightUnit)}`).join(" · "),
        });
    if (filter === "all" || filter === "prs")
      for (const pr of computePRs(history).events)
        out.push({ id: `pr-${pr.id}`, type: "prs", date: pr.date, sortKey: `${pr.date}T23:59`, title: `PR · ${exerciseById(getForgeState())[pr.exerciseId]?.name}`, detail: `Up from ${formatWeight(pr.previous, unit)}`, value: `${formatWeight(pr.weight, unit)} × ${pr.reps}` });
    out.sort((a, b) => (desc ? b.sortKey.localeCompare(a.sortKey) : a.sortKey.localeCompare(b.sortKey)));
    return out;
  }, [filter, desc, history, foodLogs, weights, measurements, unit, settings.heightUnit]);

  const visible = rows.slice(0, limit);
  const grouped = useMemo(() => {
    const m: [string, Row[]][] = [];
    for (const r of visible) {
      const last = m.at(-1);
      if (last && last[0] === r.date) last[1].push(r);
      else m.push([r.date, [r]]);
    }
    return m;
  }, [visible]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="History" title="Everything you've logged" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filter history" value={filter} onChange={(f) => { setFilter(f); setLimit(60); }} options={FILTERS} />
        <Button variant="outline" size="sm" onClick={() => setDesc((d) => !d)} aria-label={`Sort by date, ${desc ? "newest" : "oldest"} first`}>
          <ArrowDownUp data-icon="inline-start" /> {desc ? "Newest first" : "Oldest first"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card">
          <EmptyState icon={History} title="Nothing here yet" description="As you log workouts, food and weigh-ins they'll appear in this timeline." />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, list]) => (
            <section key={date} aria-label={format(fromDateKey(date), "EEEE, MMMM d")}>
              <h2 className="sticky top-14 z-10 -mx-1 mb-2 bg-background/90 px-1 py-1 text-xs font-medium text-muted-foreground backdrop-blur lg:top-0">{format(fromDateKey(date), "EEEE, MMMM d, yyyy")}</h2>
              <ul className="surface-card divide-y overflow-hidden">
                {list.map((r) => {
                  const Icon = ICONS[r.type];
                  const open = expanded === r.id;
                  return (
                    <li key={r.id}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2">
                          <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                        </span>
                        <button type="button" disabled={!r.session} onClick={() => setExpanded(open ? null : r.id)} aria-expanded={r.session ? open : undefined} className="min-w-0 flex-1 text-left disabled:cursor-default">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.detail}</p>
                        </button>
                        {r.value && <span className="num shrink-0 text-sm">{r.value}</span>}
                        {r.session && (
                          <Button variant="ghost" size="icon-xs" aria-label={`Delete ${r.title}`} onClick={() => setToDelete(r.session!)}>
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                      {open && r.session && (
                        <div className="border-t bg-surface-2/40 px-4 py-3">
                          <ul className="space-y-1.5 text-sm">
                            {r.session.exercises.map((e) => (
                              <li key={e.id} className="flex justify-between gap-3">
                                <span className="truncate">{exerciseById(getForgeState())[e.exerciseId]?.name}</span>
                                <span className="num shrink-0 text-muted-foreground">{e.sets.map((s) => `${formatWeight(s.weight, unit, 1).replace(/ (kg|lb)$/, "")}×${s.reps}`).join(", ")}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {rows.length > limit && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setLimit((l) => l + 60)}>
                Show more ({rows.length - limit} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="This workout and its sets will be removed from your history, charts and PRs."
        confirmLabel="Delete workout"
        destructive
        onConfirm={() => {
          if (toDelete) {
            forge.deleteSession(toDelete.id);
            toast("Workout deleted");
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}
