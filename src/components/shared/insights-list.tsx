import { Activity, Beef, Droplets, Flame, Scale, Target, TrendingUp, type LucideIcon } from "lucide-react";
import type { Insight, InsightKind } from "@/lib/summaries";
import { cn } from "@/lib/utils";

const ICONS: Record<InsightKind, LucideIcon> = {
  protein: Beef,
  calories: Flame,
  workouts: Activity,
  strength: TrendingUp,
  muscle: Target,
  weight: Scale,
  water: Droplets,
};

export function InsightsList({ insights, limit }: { insights: Insight[]; limit?: number }) {
  const list = limit ? insights.slice(0, limit) : insights;
  return (
    <ul className="divide-y">
      {list.map((i) => {
        const Icon = ICONS[i.kind];
        return (
          <li key={i.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={cn(
                "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
                i.tone === "positive" && "bg-brand-soft text-brand-ink",
                i.tone === "attention" && "bg-[color-mix(in_oklab,var(--warning),transparent_86%)] text-warning",
                i.tone === "neutral" && "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <p className="text-sm leading-relaxed">
              <span className="sr-only">{i.tone === "attention" ? "Needs attention: " : i.tone === "positive" ? "Going well: " : ""}</span>
              {i.text}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
