"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Heavy, gentle fade-up as content enters the viewport. */
export function Reveal({ children, className, delay = 0, y = 28 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border bg-surface/70 px-3 py-1 text-[10.5px] font-medium tracking-[0.18em] text-muted-foreground uppercase", className)}>
      <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      {children}
    </span>
  );
}

/** Pill CTA with the trailing icon nested in its own circle. */
export function PillCTA({
  href,
  onClick,
  children,
  variant = "brand",
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "brand" | "ghost";
  className?: string;
}) {
  const cls = cn(
    "group inline-flex h-12 items-center gap-3 rounded-full pr-1.5 pl-6 text-[15px] font-medium transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
    variant === "brand" ? "bg-foreground text-background hover:bg-foreground/90" : "border bg-surface/70 text-foreground hover:bg-surface",
    className,
  );
  const inner = (
    <>
      {children}
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
          variant === "brand" ? "bg-brand text-[#1a2a05]" : "bg-foreground/[0.06]",
        )}
        aria-hidden
      >
        <ArrowUpRight className="size-4" strokeWidth={2} />
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Nested "tray + plate" card shell. */
export function Bezel({ children, className, innerClassName }: { children: React.ReactNode; className?: string; innerClassName?: string }) {
  return (
    <div className={cn("rounded-[2rem] bg-foreground/[0.035] p-1.5 ring-1 ring-foreground/[0.06] dark:bg-white/[0.03]", className)}>
      <div className={cn("h-full rounded-[calc(2rem-0.375rem)] bg-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.6),var(--shadow-soft)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]", innerClassName)}>{children}</div>
    </div>
  );
}
