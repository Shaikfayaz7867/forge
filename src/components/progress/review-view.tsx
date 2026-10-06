"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { InsightsList } from "@/components/shared/insights-list";
import { StatCard } from "@/components/shared/metric-card";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { ProgressRing } from "@/components/shared/progress-ring";
import { useTargets, useToday } from "@/hooks/use-forge-derived";
import { fromDateKey, weekStart } from "@/lib/dates";
import { buildInsights, formatRangeLabel, weeklyReview } from "@/lib/summaries";
import { formatNumber, formatVolume, formatWeight } from "@/lib/units";
import { useForge } from "@/store/forge-store";

function ConsistencyRing({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4">
      <ProgressRing value={value} max={100} size={84} stroke={8} label={`${label}: ${value}%`}>
        <span className="num text-lg font-semibold">{value}%</span>
      </ProgressRing>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function ReviewView() {
  const state = useForge();
  const today = useToday();
  const targets = useTargets()!;
  const unit = state.settings.weightUnit;
  const [offset, setOffset] = useState(0);
  const anchor = addDays(weekStart(fromDateKey(today)), offset * 7);
  const anchorTime = anchor.getTime();
  const r = useMemo(() => weeklyReview(state, new Date(anchorTime)), [state, anchorTime]);
  const insights = useMemo(() => (offset === 0 ? buildInsights(state) : []), [state, offset]);
  const weightDiff = r.startWeight !== null && r.endWeight !== null ? r.endWeight - r.startWeight : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Weekly review"
        title={formatRangeLabel(r.start, r.end)}
        actions={
          <div className="flex items-center gap-1 rounded-full border bg-surface p-0.5">
            <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week">
              <ChevronLeft />
            </Button>
            <span className="min-w-20 text-center text-[13px] font-medium">{offset === 0 ? "This week" : offset === -1 ? "Last week" : `${-offset} weeks ago`}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0} aria-label="Next week">
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <motion.p key={r.start} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-[60ch] text-xl leading-relaxed tracking-tight text-balance sm:text-2xl">
        {r.summary}
      </motion.p>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Training" />
          <div className="mt-5 grid grid-cols-2 gap-5">
            <StatCard label="Workouts" value={`${r.workouts} / ${r.target}`} />
            <StatCard label="Total volume" value={formatVolume(r.totalVolume, unit)} sub={r.volumeChangePct !== null ? `${r.volumeChangePct > 0 ? "+" : ""}${r.volumeChangePct}% vs avg` : undefined} />
            <StatCard label="Total sets" value={r.totalSets} />
            <StatCard label="PRs" value={r.prs} />
            <StatCard className="col-span-2" label="Favourite exercise" value={r.favoriteExercise ? exerciseById(getForgeState())[r.favoriteExercise]?.name : "—"} />
          </div>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Nutrition" />
          <div className="mt-5 grid grid-cols-2 gap-5">
            <StatCard label="Avg calories" value={r.avgCalories !== null ? `${formatNumber(r.avgCalories)}` : "—"} sub={`target ${formatNumber(targets.calories)}`} />
            <StatCard label="Avg protein" value={r.avgProtein !== null ? `${r.avgProtein}g` : "—"} sub={`target ${targets.protein}g`} />
            <StatCard label="On-target days" value={r.calorieConsistencyPct !== null ? `${r.calorieConsistencyPct}%` : "—"} sub="within ±10%" />
            <StatCard label="Days logged" value={r.daysLogged} />
          </div>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Body" />
          <div className="mt-5 grid grid-cols-2 gap-5">
            <StatCard label="Starting weight" value={r.startWeight !== null ? formatWeight(r.startWeight, unit) : "—"} />
            <StatCard label="Ending weight" value={r.endWeight !== null ? formatWeight(r.endWeight, unit) : "—"} />
            <StatCard className="col-span-2" label="Change" value={weightDiff !== null ? `${weightDiff >= 0 ? "+" : "−"}${formatWeight(Math.abs(weightDiff), unit)}` : "Log weight to compare"} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Consistency" />
          <div className="mt-5 space-y-4">
            <ConsistencyRing label="Workout consistency" value={r.workoutConsistencyPct} />
            <ConsistencyRing label="Nutrition logging" value={r.loggingConsistencyPct} />
          </div>
        </section>
        {offset === 0 && (
          <section className="surface-card p-5 sm:p-6">
            <SectionTitle title="Insights" description="Rule-based observations from your data" />
            <div className="mt-4">
              <InsightsList insights={insights} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
