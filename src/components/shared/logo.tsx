import { cn } from "@/lib/utils";

/** Forge mark: three ascending bars — progression, not a dumbbell. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7 shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-foreground" />
      <rect x="8" y="17" width="4" height="7" rx="1.5" className="fill-background" />
      <rect x="14" y="12.5" width="4" height="11.5" rx="1.5" className="fill-background" />
      <rect x="20" y="8" width="4" height="16" rx="1.5" fill="var(--brand)" />
    </svg>
  );
}

export function Logo({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!collapsed && <span className="text-[15px] font-semibold tracking-[0.18em]">FORGE</span>}
    </span>
  );
}
