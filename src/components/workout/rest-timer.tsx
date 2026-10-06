"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus, SkipForward, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REST_PRESETS } from "@/data/constants";
import { formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";

export interface RestState {
  endsAt: number;
  total: number;
}

const currentTime = () => Date.now();

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.2, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Audio is a nicety; ignore if the browser blocks it.
  }
}

interface Props {
  rest: RestState | null;
  onChange: (rest: RestState | null) => void;
  sound: boolean;
  variant?: "panel" | "bar";
  className?: string;
}

/** Countdown timer. Time is derived from `endsAt`, so it stays accurate if the tab sleeps. */
export function RestTimer({ rest, onChange, sound, variant = "panel", className }: Props) {
  const [now, setNow] = useState(currentTime);
  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState("150");
  const fired = useRef<number | null>(null);

  useEffect(() => {
    if (!rest) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest]);

  const remaining = rest ? Math.min(rest.total, Math.max(0, Math.ceil((rest.endsAt - now) / 1000))) : 0;

  useEffect(() => {
    if (!rest || remaining > 0 || fired.current === rest.endsAt) return;
    fired.current = rest.endsAt;
    if (sound) beep();
    navigator.vibrate?.([120, 60, 120]);
    const t = setTimeout(() => onChange(null), 900);
    return () => clearTimeout(t);
  }, [remaining, rest, sound, onChange]);

  const start = (sec: number) => {
    const t = currentTime();
    setNow(t);
    onChange({ endsAt: t + sec * 1000, total: sec });
  };
  const add = (sec: number) => rest && onChange({ endsAt: rest.endsAt + sec * 1000, total: rest.total + sec });

  const progress = rest ? remaining / rest.total : 0;
  const size = variant === "panel" ? 168 : 44;
  const stroke = variant === "panel" ? 8 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const ring = (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
        style={{ transition: "stroke-dashoffset 250ms linear" }}
      />
    </svg>
  );

  const presets = (
    <div className="flex flex-wrap gap-1.5">
      {REST_PRESETS.map((s) => (
        <Button key={s} size="sm" variant="outline" onClick={() => start(s)} className="num">
          {s}s
        </Button>
      ))}
      {custom ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(customValue, 10);
            if (n > 0 && n <= 900) {
              start(n);
              setCustom(false);
            }
          }}
        >
          <Input value={customValue} onChange={(e) => setCustomValue(e.target.value)} type="number" min={5} max={900} className="num h-8 w-20 px-2" aria-label="Custom rest seconds" autoFocus />
          <Button size="sm" type="submit">
            Go
          </Button>
        </form>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setCustom(true)}>
          Custom
        </Button>
      )}
    </div>
  );

  if (variant === "bar") {
    return (
      <AnimatePresence>
        {rest && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className={cn("flex items-center gap-3 rounded-2xl border bg-surface p-2 pr-2.5 shadow-(--shadow-lift)", className)}
            role="timer"
            aria-live="off"
            aria-label={`Rest ${remaining} seconds remaining`}
          >
            <div className="relative grid place-items-center">
              {ring}
              <Timer className="absolute size-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">Rest</p>
              <p className="num text-lg leading-none font-semibold">{formatDuration(remaining)}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => add(30)} aria-label="Add 30 seconds">
              +30s
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Skip
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Rest timer</p>
        {rest && <span className="num text-xs text-muted-foreground">{rest.total}s</span>}
      </div>
      <div className="flex justify-center">
        <div className="relative grid place-items-center" role="timer" aria-label={rest ? `${remaining} seconds remaining` : "Rest timer idle"}>
          {ring}
          <div className="absolute text-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={rest ? "on" : "off"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="num text-4xl font-semibold tracking-tight"
              >
                {rest ? formatDuration(remaining) : "—"}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground">{rest ? (remaining === 0 ? "Go!" : "remaining") : "Starts after each set"}</p>
          </div>
        </div>
      </div>
      {rest ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => add(30)}>
            <Plus data-icon="inline-start" /> 30 sec
          </Button>
          <Button variant="outline" onClick={() => onChange(null)}>
            <SkipForward data-icon="inline-start" /> Skip
          </Button>
        </div>
      ) : (
        presets
      )}
    </div>
  );
}
