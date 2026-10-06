"use client";

import { addDays, format } from "date-fns";
import { Plus, Scale, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeightChart } from "@/components/charts/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/metric-card";
import { SectionTitle } from "@/components/shared/page-header";
import { Segmented } from "@/components/shared/segmented";
import { RANGE_OPTIONS, type RangeId } from "@/data/constants";
import { fromDateKey, toDateKey } from "@/lib/dates";
import { weightTrendPerWeek } from "@/lib/summaries";
import { formatWeight, fromDisplayWeight, toDisplayWeight } from "@/lib/units";
import { forge, useForge } from "@/store/forge-store";

const WEIGHT_RANGES = RANGE_OPTIONS.filter((r) => r.id !== "all");

export function LogWeightDialog({ open, onOpenChange, today }: { open: boolean; onOpenChange: (o: boolean) => void; today: string }) {
  const { settings, weights } = useForge();
  const unit = settings.weightUnit;
  const last = weights.at(-1);
  const [value, setValue] = useState(last ? String(toDisplayWeight(last.weightKg, unit)) : "");
  const [date, setDate] = useState(today);
  const [touched, setTouched] = useState(false);

  const n = parseFloat(value);
  const kg = Number.isNaN(n) ? NaN : fromDisplayWeight(n, unit);
  const error = Number.isNaN(kg) ? "Enter your weight" : kg < 30 || kg > 250 ? `Enter a weight between ${unit === "kg" ? "30–250 kg" : "66–550 lb"}` : date > today ? "Date can't be in the future" : null;

  const save = () => {
    setTouched(true);
    if (error) {
      toast.error(error);
      return;
    }
    const existing = weights.find((w) => w.date === date);
    const roundedKg = Math.round(kg * 100) / 100;
    if (existing) {
      forge.updateWeight(existing.id, date, roundedKg);
      toast.success(`Updated ${formatWeight(roundedKg, unit)}`, { description: format(fromDateKey(date), "EEEE, MMM d") });
    } else {
      forge.addWeight(date, roundedKg);
      toast.success(`Logged ${formatWeight(roundedKg, unit)}`, { description: format(fromDateKey(date), "EEEE, MMM d") });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log weight</DialogTitle>
          <DialogDescription>Weigh in at a similar time each day for the clearest trend.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          noValidate
        >
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="weight-value">Weight</Label>
              <div className="relative">
                <Input
                  id="weight-value"
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={touched && !!error}
                  aria-describedby="weight-err"
                  className="num h-14 pr-12 text-2xl font-semibold"
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground">{unit}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight-date">Date</Label>
              <Input id="weight-date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value || today)} className="h-14" />
            </div>
          </div>
          {touched && error && (
            <p id="weight-err" role="alert" className="text-[13px] text-destructive">
              {error}
            </p>
          )}
          {weights.some((w) => w.date === date) && <p className="text-xs text-muted-foreground">This replaces the entry you already have for that day.</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save weight</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WeightSection({ today, onLog }: { today: string; onLog: () => void }) {
  const { weights: rawWeights, settings, profile } = useForge();
  const unit = settings.weightUnit;
  const weights = useMemo(
    () => rawWeights.filter((w) => w && typeof w.weightKg === "number" && !Number.isNaN(w.weightKg)),
    [rawWeights],
  );
  const [range, setRange] = useState<RangeId>("30d");

  const filtered = useMemo(() => {
    const r = WEIGHT_RANGES.find((x) => x.id === range)!;
    const since = toDateKey(addDays(fromDateKey(today), -r.days));
    return weights.filter((w) => w.date >= since);
  }, [weights, range, today]);

  const current = weights.at(-1);
  const first = filtered[0];
  const change = current && first ? current.weightKg - first.weightKg : 0;
  const trend = weightTrendPerWeek(filtered);
  const gaining = profile && ["build_muscle", "gain_weight", "strength"].includes(profile.goal);

  return (
    <section className="surface-card p-5 sm:p-7" aria-labelledby="weight-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle title="Body weight" description="How your weight is moving over time" />
        <div className="flex items-center gap-2">
          <Segmented label="Weight range" value={range} onChange={setRange} options={WEIGHT_RANGES} />
          <Button size="sm" onClick={onLog}>
            <Plus data-icon="inline-start" /> Log
          </Button>
        </div>
      </div>
      <h2 id="weight-title" className="sr-only">
        Body weight
      </h2>

      {weights.length === 0 ? (
        <EmptyState icon={Scale} title="No weight data yet." description="Add your first measurement." action={<Button onClick={onLog}>Log weight</Button>} />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4 border-b pb-5">
            <StatCard label="Current" value={current ? formatWeight(current.weightKg, unit) : "—"} sub={current ? format(fromDateKey(current.date), "MMM d") : undefined} />
            <StatCard label="Change" value={`${change >= 0 ? "+" : "−"}${formatWeight(Math.abs(change), unit)}`} sub={WEIGHT_RANGES.find((r) => r.id === range)?.label} />
            <StatCard
              label="Trend"
              value={`${trend >= 0 ? "+" : "−"}${formatWeight(Math.abs(trend), unit, 2)}`}
              sub={
                <span className={gaining ? (trend > 0 ? "text-brand-ink" : "") : profile?.goal === "lose_fat" && trend < 0 ? "text-brand-ink" : ""}>per week</span>
              }
            />
          </div>
          <div className="mt-5">
            {filtered.length >= 2 ? (
              <WeightChart data={filtered.map((w) => ({ date: w.date, value: toDisplayWeight(w.weightKg, unit) }))} unit={unit} height={260} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Log at least two weigh-ins in this range to see a trend.</p>
            )}
          </div>
          <details className="group mt-4">
            <summary className="cursor-pointer list-none text-[13px] text-muted-foreground hover:text-foreground">
              <span className="group-open:hidden">Show entries ({weights.length})</span>
              <span className="hidden group-open:inline">Hide entries</span>
            </summary>
            <ul className="mt-3 max-h-72 divide-y overflow-y-auto rounded-2xl border">
              {[...weights].reverse().map((w, i, arr) => {
                const prev = arr[i + 1];
                const d = prev ? w.weightKg - prev.weightKg : 0;
                return (
                  <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{format(fromDateKey(w.date), "EEE, MMM d yyyy")}</span>
                    <span className="flex items-center gap-3">
                      {prev && (
                        <span className="num text-xs text-muted-foreground">
                          {d >= 0 ? "+" : "−"}
                          {toDisplayWeight(Math.abs(d), unit)}
                        </span>
                      )}
                      <span className="num font-medium">{formatWeight(w.weightKg, unit)}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Delete weight entry for ${w.date}`}
                        onClick={() => {
                          forge.removeWeight(w.id);
                          toast("Entry removed", { action: { label: "Undo", onClick: () => forge.addWeight(w.date, w.weightKg) } });
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
