import { WORKOUT_CATEGORIES } from "@/data/constants";
import type { WorkoutCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const categoryLabel = (c: WorkoutCategory) => WORKOUT_CATEGORIES.find((x) => x.id === c)?.label ?? c;

export function CategoryBadge({ category, className }: { category: WorkoutCategory; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border bg-surface-2/70 px-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      {categoryLabel(category)}
    </span>
  );
}
