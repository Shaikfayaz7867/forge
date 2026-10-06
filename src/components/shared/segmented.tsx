"use client";

import { motion } from "motion/react";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}

/** Pill segmented control with a sliding indicator. Behaves as an ARIA radio group. */
export function Segmented<T extends string>({ options, value, onChange, label, className, size = "sm" }: Props<T>) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  const move = (delta: number) => {
    const i = options.findIndex((o) => o.id === value);
    const next = options[(i + delta + options.length) % options.length];
    onChange(next.id);
    requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`)?.focus();
    });
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border bg-surface-2/70 p-0.5 scrollbar-none",
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            data-id={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative shrink-0 rounded-full font-medium transition-colors",
              size === "sm" ? "h-7 px-3 text-xs" : "h-9 px-4 text-sm",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full border bg-surface shadow-(--shadow-soft)"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
