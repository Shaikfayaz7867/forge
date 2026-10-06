"use client";

import { motion } from "motion/react";
import { Droplets, Minus } from "lucide-react";
import { WATER_INCREMENTS } from "@/data/constants";
import { forge, useForge } from "@/store/forge-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WaterTracker({ date, compact, className }: { date: string; compact?: boolean; className?: string }) {
  const { water, settings } = useForge();
  const ml = water[date] ?? 0;
  const goal = settings.waterGoalMl;
  const pct = Math.min(1, ml / goal);
  const glasses = 10;
  const filled = Math.round(pct * glasses);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Droplets className="size-4 text-water" strokeWidth={1.75} aria-hidden /> Water
          </p>
          <p className="num mt-1 text-2xl font-semibold tracking-tight">
            {(ml / 1000).toFixed(2).replace(/0$/, "")}L
            <span className="text-base font-normal text-muted-foreground"> / {(goal / 1000).toFixed(1)}L</span>
          </p>
        </div>
        {ml > 0 && (
          <Button variant="ghost" size="icon-sm" onClick={() => forge.addWater(date, -250)} aria-label="Remove 250 ml">
            <Minus />
          </Button>
        )}
      </div>
      <div className="flex gap-1" role="progressbar" aria-label="Water intake" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={ml}>
        {Array.from({ length: glasses }, (_, i) => (
          <motion.span
            key={i}
            className={cn("h-6 flex-1 rounded-[5px]", i < filled ? "bg-water" : "bg-muted")}
            initial={false}
            animate={{ scaleY: i < filled ? 1 : 0.7, opacity: i < filled ? 1 : 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 22, delay: i < filled ? i * 0.02 : 0 }}
          />
        ))}
      </div>
      <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-3")}>
        {WATER_INCREMENTS.map((inc) => (
          <Button key={inc} variant="outline" size={compact ? "sm" : "default"} onClick={() => forge.addWater(date, inc)} aria-label={`Add ${inc} ml of water`}>
            +{inc}ml
          </Button>
        ))}
      </div>
    </div>
  );
}
