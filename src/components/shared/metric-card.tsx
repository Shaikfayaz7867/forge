import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  delta?: { value: string; direction: "up" | "down" | "flat"; positive?: boolean };
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

/** A single headline metric. Lifts slightly on hover when it links somewhere. */
export function MetricCard({ label, value, unit, icon: Icon, hint, delta, href, className, children }: MetricCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground/80" strokeWidth={1.75} aria-hidden />}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="num text-[28px] leading-none font-semibold tracking-[-0.03em]">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {(hint || delta) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          {delta && <DeltaPill {...delta} />}
          {hint}
        </div>
      )}
      {children}
    </>
  );

  const cls = cn(
    "surface-card block p-5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    href && "hover:-translate-y-0.5 hover:shadow-(--shadow-lift) focus-visible:-translate-y-0.5",
    className,
  );

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function DeltaPill({
  value,
  direction,
  positive,
}: {
  value: string;
  direction: "up" | "down" | "flat";
  positive?: boolean;
}) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const tone =
    direction === "flat" || positive === undefined
      ? "bg-muted text-muted-foreground"
      : positive
        ? "bg-brand-soft text-brand-ink"
        : "bg-[color-mix(in_oklab,var(--warning),transparent_88%)] text-warning";
  return (
    <span className={cn("num inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium", tone)}>
      <Icon className="size-3" strokeWidth={2} aria-hidden />
      {value}
    </span>
  );
}

/** Compact label/value pair used inside cards. */
export function StatCard({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-[12px] text-muted-foreground">{label}</p>
      <p className="num mt-1 truncate text-lg leading-tight font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
