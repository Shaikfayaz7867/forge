"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * One-shot URL actions like `/nutrition?add=1`. Calls `onTrigger` once per new value
 * (during render, React's "adjust state on prop change" pattern), then strips the
 * param from the URL so a refresh doesn't reopen the dialog.
 */
export function useUrlTrigger(name: string, onTrigger: (value: string) => void) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = params.get(name);
  const [seen, setSeen] = useState<string | null>(null);

  if (value !== seen) {
    setSeen(value);
    if (value !== null) onTrigger(value);
  }

  useEffect(() => {
    if (value === null) return;
    const next = new URLSearchParams(params.toString());
    next.delete(name);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [value, name, params, pathname, router]);
}
