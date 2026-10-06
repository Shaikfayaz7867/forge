"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useRef } from "react";

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}

const makeFormat = (decimals: number) => (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Counts up to `value` when scrolled into view, and tweens on later changes. */
export function AnimatedNumber({ value, decimals = 0, duration = 0.9, className, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const reduce = useReducedMotion();
  const from = useRef(0);
  const render = useEffectEvent((el: HTMLElement, v: number) => {
    el.textContent = (format ?? makeFormat(decimals))(v);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      render(el, value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => render(el, v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, reduce, duration]);

  return (
    <span ref={ref} className={`num ${className ?? ""}`}>
      {(format ?? makeFormat(decimals))(reduce ? value : 0)}
    </span>
  );
}
