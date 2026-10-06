"use client";

import { format } from "date-fns";
import { fromDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 } as const;
export const GRID_STROKE = "var(--chart-grid)";

export const tickDate = (key: string) => format(fromDateKey(key), "MMM d");
export const tickWeekday = (key: string) => format(fromDateKey(key), "EEEEE");

interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

interface Payload {
  value?: number | string | (number | string)[];
  name?: number | string;
  color?: string;
  dataKey?: unknown;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly Payload[];
  label?: string | number;
  labelFormat?: (label: string) => string;
  rows: (p: readonly Payload[]) => TooltipRow[];
}

/** Card-styled tooltip; values in ink, colour only as a small key swatch. */
export function ChartTooltip({ active, payload, label, labelFormat, rows }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const items = rows(payload);
  if (!items.length) return null;
  const l = label === undefined ? "" : String(label);
  return (
    <div className="min-w-36 rounded-xl border bg-popover px-3 py-2.5 text-xs shadow-(--shadow-lift)">
      {l && <p className="mb-1.5 font-medium text-foreground">{labelFormat ? labelFormat(l) : l}</p>}
      <div className="space-y-1">
        {items.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden />}
              {r.label}
            </span>
            <span className="num font-medium text-foreground">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartFrame({
  height = 220,
  children,
  className,
  label,
}: {
  height?: number;
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <figure className={cn("w-full", className)} style={{ height }} aria-label={label} role="group">
      {children}
    </figure>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.dashed ? (
            <span className="w-3 border-t border-dashed" style={{ borderColor: i.color }} aria-hidden />
          ) : (
            <span className="size-2 rounded-full" style={{ background: i.color }} aria-hidden />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
