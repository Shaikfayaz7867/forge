"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { muscleGroups } from "@/data/constants";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import type { MuscleStat } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";

/** Horizontal bars of sets per muscle group, flagging groups well below the average. */
export function MuscleBars({ stats, className }: { stats: MuscleStat[]; className?: string }) {
  const relevant = stats.filter((s) => s.muscle !== "core" || s.sets > 0);
  const max = Math.max(1, ...relevant.map((s) => s.sets));
  const avg = relevant.reduce((a, s) => a + s.sets, 0) / Math.max(1, relevant.length);

  return (
    <ul className={cn("space-y-3", className)}>
      {relevant.map((s, i) => {
        const label = muscleGroups.find((g) => g.id === s.muscle)?.label ?? s.muscle;
        const low = avg > 0 && s.sets < avg * 0.45;
        return (
          <li key={s.muscle} className="grid grid-cols-[84px_1fr_auto] items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              {label}
              {low && <AlertCircle className="size-3.5 text-warning" aria-label="Under-trained" />}
            </span>
            <span className="h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.span
                className={cn("block h-full origin-left rounded-full", low ? "bg-warning" : "bg-foreground/85")}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: s.sets / max }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 60, damping: 18, delay: i * 0.05 }}
              />
            </span>
            <span className="num w-16 text-right text-sm">
              {s.sets} <span className="text-muted-foreground">sets</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
