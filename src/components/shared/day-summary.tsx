"use client";

import { format } from "date-fns";
import { Check, Droplets, Scale, Utensils } from "lucide-react";
import { fromDateKey, formatMinutes } from "@/lib/dates";
import type { DaySummary } from "@/lib/summaries";
import { formatNumber, formatWeight } from "@/lib/units";
import type { WeightUnit } from "@/lib/types";

/** End-of-day summary: workout, nutrition, weight, water. */
export function DaySummaryCard({ summary, unit, calorieTarget }: { summary: DaySummary; unit: WeightUnit; calorieTarget?: number }) {
  const rows = [
    {
      label: "Workout",
      icon: Check,
      value: summary.sessions.length ? summary.sessions.map((s) => s.name).join(", ") : "Rest day",
      sub: summary.sessions.length ? summary.sessions.map((s) => formatMinutes(s.durationSec)).join(" · ") : undefined,
      active: summary.sessions.length > 0,
    },
    {
      label: "Nutrition",
      icon: Utensils,
      value: summary.foodCount ? `${formatNumber(summary.macros.calories)} kcal` : "Not logged",
      sub: summary.foodCount ? `${Math.round(summary.macros.protein)}g protein${calorieTarget ? ` · target ${formatNumber(calorieTarget)}` : ""}` : undefined,
      active: summary.foodCount > 0,
    },
    { label: "Weight", icon: Scale, value: summary.weightKg ? formatWeight(summary.weightKg, unit) : "—", active: !!summary.weightKg },
    { label: "Water", icon: Droplets, value: summary.waterMl ? `${(summary.waterMl / 1000).toFixed(2).replace(/0$/, "")}L` : "—", active: summary.waterMl > 0 },
  ];
  return (
    <div>
      <p className="eyebrow">{format(fromDateKey(summary.date), "EEEE")}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{format(fromDateKey(summary.date), "MMMM d")}</p>
      <dl className="mt-4 divide-y rounded-2xl border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-3">
            <span className={r.active ? "grid size-8 place-items-center rounded-lg bg-brand-soft text-brand-ink" : "grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"}>
              <r.icon className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <dt className="w-20 text-sm text-muted-foreground">{r.label}</dt>
            <dd className="min-w-0 flex-1 text-right">
              <span className="num block truncate text-sm font-medium">{r.value}</span>
              {r.sub && <span className="num block truncate text-xs text-muted-foreground">{r.sub}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
