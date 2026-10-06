"use client";

import { useEffect, useMemo, useState } from "react";
import { calcTargets, type Targets } from "@/lib/calculations";
import { todayKey } from "@/lib/dates";
import { useForge } from "@/store/forge-store";

export function useTargets(): Targets | null {
  const { profile } = useForge();
  return useMemo(() => (profile ? calcTargets(profile) : null), [profile]);
}

export function useUnits() {
  const { settings } = useForge();
  return { weightUnit: settings.weightUnit, heightUnit: settings.heightUnit };
}

/** Ticks every `ms` milliseconds; used for elapsed timers. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Today's date key, refreshed when the tab regains focus after midnight. */
export function useToday(): string {
  const [key, setKey] = useState(todayKey);
  useEffect(() => {
    const update = () => setKey(todayKey());
    window.addEventListener("focus", update);
    const t = setInterval(update, 60_000);
    return () => {
      window.removeEventListener("focus", update);
      clearInterval(t);
    };
  }, []);
  return key;
}
