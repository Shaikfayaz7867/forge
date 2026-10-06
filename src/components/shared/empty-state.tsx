import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <div className="relative mb-1 grid size-12 place-items-center rounded-2xl border bg-surface-2/60">
        <Icon className="size-5 text-muted-foreground" strokeWidth={1.6} aria-hidden />
        <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-4 ring-surface" />
      </div>
      <p className="text-[15px] font-medium tracking-tight">{title}</p>
      {description && <p className="max-w-[34ch] text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
