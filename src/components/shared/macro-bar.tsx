"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
  className?: string;
}

export function MacroBar({ label, value, target, unit = "g", color, className }: Props) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = target > 0 && value > target * 1.1;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className="size-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="num text-sm font-medium">
          {Math.round(value)}
          <span className="font-normal text-muted-foreground">
            {" "}
            / {Math.round(target)}
            {unit}
          </span>
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${label}: ${Math.round(value)} of ${Math.round(target)}${unit}`}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
        aria-valuenow={Math.round(value)}
      >
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ background: over ? "var(--warning)" : color }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ type: "spring", stiffness: 70, damping: 20 }}
        />
      </div>
    </div>
  );
}
