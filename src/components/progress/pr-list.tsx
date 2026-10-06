"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { fromDateKey } from "@/lib/dates";
import { formatWeight } from "@/lib/units";
import type { WeightUnit } from "@/lib/types";
import type { PREvent } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";

export function PRCard({ pr, unit, index = 0, highlight }: { pr: PREvent; unit: WeightUnit; index?: number; highlight?: boolean }) {
  const ex = exerciseById(getForgeState())[pr.exerciseId];
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 24 }}
      className={cn("flex items-center gap-3 rounded-2xl border bg-surface p-3", highlight && "border-brand/50 bg-brand-soft")}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2">
        <Trophy className="size-[18px] text-brand-ink" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{ex?.name ?? pr.exerciseId}</span>
        <span className="block text-xs text-muted-foreground">
          {format(fromDateKey(pr.date), "MMM d")} · up from {formatWeight(pr.previous, unit)}
        </span>
      </span>
      <span className="num text-right">
        <span className="block text-sm font-semibold">{formatWeight(pr.weight, unit)}</span>
        <span className="block text-xs text-muted-foreground">× {pr.reps}</span>
      </span>
    </motion.li>
  );
}

export function PRList({ prs, unit, limit = 5 }: { prs: PREvent[]; unit: WeightUnit; limit?: number }) {
  return (
    <ul className="space-y-2">
      {prs.slice(0, limit).map((pr, i) => (
        <PRCard key={pr.id} pr={pr} unit={unit} index={i} />
      ))}
    </ul>
  );
}
