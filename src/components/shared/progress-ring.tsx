"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackClassName?: string;
  className?: string;
  label?: string;
  children?: React.ReactNode;
}

/** Circular progress. Intake beyond 100% is drawn as a second lap in the warning colour. */
export function ProgressRing({
  value,
  max,
  size = 160,
  stroke = 12,
  color = "var(--brand)",
  trackClassName,
  className,
  label,
  children,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? value / max : 0;
  const main = Math.min(1, Math.max(0, ratio));
  const over = Math.min(1, Math.max(0, ratio - 1));

  return (
    <div
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(ratio * 100)}% of target`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={cn("stroke-muted", trackClassName)}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - main) }}
          transition={{ type: "spring", stiffness: 60, damping: 18, mass: 0.9 }}
        />
        {over > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--warning)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - over) }}
            transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.3 }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
