"use client";

import { MoveHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  before: React.ReactNode;
  after: React.ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  initial?: number;
}

/** Drag (or use arrow keys on) the handle to reveal before/after layers. */
export function BeforeAfterSlider({ before, after, beforeLabel = "Before", afterLabel = "After", className, initial = 50 }: Props) {
  const [pos, setPos] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div
      ref={ref}
      className={cn("relative touch-none overflow-hidden select-none", className)}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {before}
      </div>
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur">{beforeLabel}</span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur">{afterLabel}</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg">
          <MoveHorizontal className="size-4" aria-hidden />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparison slider"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
