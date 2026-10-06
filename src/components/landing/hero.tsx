"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Trophy } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { ProgressRing } from "@/components/shared/progress-ring";
import { cn } from "@/lib/utils";
import { Bezel, Eyebrow, PillCTA } from "./primitives";
import { useExploreDashboard, useStartHref } from "./use-start";

const SETS = [
  { w: 47.5, r: 10 },
  { w: 50, r: 8 },
  { w: 50, r: 8 },
];

/** Perpetual loop: sets tick off one by one, then reset. Isolated so it never re-renders the hero. */
const LiveSets = memo(function LiveSets() {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone((d) => (d >= SETS.length + 1 ? 0 : d + 1)), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <ul className="space-y-1.5">
      {SETS.map((s, i) => {
        const complete = i < done;
        return (
          <li key={i} className={cn("grid grid-cols-[28px_1fr_1fr_36px] items-center gap-2 rounded-xl px-2 py-1.5 transition-colors duration-500", complete ? "bg-brand-soft" : "bg-surface-2/60")}>
            <span className="num text-xs text-muted-foreground">{i + 1}</span>
            <span className="num text-sm font-semibold">{s.w} kg</span>
            <span className="num text-sm text-muted-foreground">× {s.r}</span>
            <span className={cn("grid size-7 place-items-center rounded-lg transition-colors duration-300", complete ? "bg-brand text-[#1a2a05]" : "bg-surface text-muted-foreground/50")}>
              <AnimatePresence mode="popLayout">
                <motion.span key={String(complete)} initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                  <Check className="size-3.5" strokeWidth={3} />
                </motion.span>
              </AnimatePresence>
            </span>
          </li>
        );
      })}
    </ul>
  );
});

const PRToast = memo(function PRToast() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const first = setTimeout(() => setShow(true), 2200);
    const loop = setInterval(() => {
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    }, 7000);
    const hide = setTimeout(() => setShow(false), 5200);
    return () => {
      clearTimeout(first);
      clearTimeout(hide);
      clearInterval(loop);
    };
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
          className="flex items-center gap-2.5 rounded-full bg-foreground py-2 pr-4 pl-2 text-background shadow-(--shadow-lift)"
        >
          <span className="grid size-7 place-items-center rounded-full bg-brand text-[#1a2a05]">
            <Trophy className="size-3.5" strokeWidth={2} />
          </span>
          <span className="text-[13px] font-medium">
            New PR · Bench Press <span className="num opacity-70">50 kg</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const WEIGHT_PATH = "M0 52 C 20 50, 30 46, 45 44 S 70 40, 85 36 S 110 34, 125 28 S 150 22, 170 18 S 195 12, 210 10";

function Float({ children, className, delay = 0, amplitude = 6 }: { children: React.ReactNode; className?: string; delay?: number; amplitude?: number }) {
  return (
    <motion.div className={className} animate={{ y: [0, -amplitude, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}>
      {children}
    </motion.div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:mx-0" aria-hidden>
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand),transparent_82%),transparent)] blur-2xl" />

      <motion.div initial={{ opacity: 0, y: 30, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}>
        <Bezel innerClassName="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Workout · live</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">Push Day</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Elapsed</p>
              <p className="num text-lg font-semibold">32:14</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="font-medium">Bench Press</p>
            <p className="num text-xs text-muted-foreground">Last: 47.5 × 10</p>
          </div>
          <div className="mt-3">
            <LiveSets />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4">
            {[
              { l: "Exercises", v: "3 / 5" },
              { l: "Sets", v: "9 / 15" },
              { l: "Volume", v: "4,250" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-[11px] text-muted-foreground">{s.l}</p>
                <p className="num font-semibold">{s.v}</p>
              </div>
            ))}
          </div>
        </Bezel>
      </motion.div>

      {/* Calorie ring */}
      <Float className="absolute -top-6 -right-2 hidden sm:block lg:-right-10" delay={0.4}>
        <motion.div initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 0.6, type: "spring", stiffness: 140, damping: 18 }}>
          <Bezel innerClassName="flex items-center gap-3 p-3.5 pr-5">
            <ProgressRing value={2140} max={2500} size={64} stroke={7}>
              <span className="num text-[11px] font-semibold">86%</span>
            </ProgressRing>
            <div>
              <p className="text-[11px] text-muted-foreground">Calories</p>
              <p className="num text-sm font-semibold">
                <AnimatedNumber value={2140} /> <span className="font-normal text-muted-foreground">/ 2,500</span>
              </p>
              <p className="num text-[11px] text-muted-foreground">Protein 86 / 110g</p>
            </div>
          </Bezel>
        </motion.div>
      </Float>

      {/* Weight trend */}
      <Float className="absolute -bottom-20 -left-4 hidden w-[240px] sm:block lg:-left-14" delay={1.2} amplitude={5}>
        <motion.div initial={{ opacity: 0, scale: 0.9, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 0.8, type: "spring", stiffness: 140, damping: 18 }}>
          <Bezel innerClassName="p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] text-muted-foreground">Weight · 60 days</p>
              <p className="num text-[11px] font-medium text-brand-ink">+1.1 kg</p>
            </div>
            <p className="num text-lg font-semibold">56.1 kg</p>
            <svg viewBox="0 0 210 60" className="mt-1 h-12 w-full overflow-visible">
              <motion.path d={WEIGHT_PATH} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 1, ease: [0.16, 1, 0.3, 1] }} />
              <motion.circle cx="210" cy="10" r="4" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.4 }} />
            </svg>
          </Bezel>
        </motion.div>
      </Float>

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 sm:-right-4 sm:left-auto sm:translate-x-0">
        <PRToast />
      </div>
    </div>
  );
}

export function Hero({ stats }: { stats: { value: number; suffix: string; label: string }[] }) {
  const startHref = useStartHref();
  const explore = useExploreDashboard();
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-24 sm:px-6 sm:pt-40 lg:pb-32">
      <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_20%,black,transparent)]" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        <div>
          {/* Hero copy animates with CSS so it paints immediately, before hydration. */}
          <div className="hero-in">
            <Eyebrow>Workouts · Nutrition · Progress</Eyebrow>
          </div>
          <h1 className="hero-in mt-6 text-[44px] leading-[0.98] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[76px]" style={{ animationDelay: "60ms" }}>
            Train smarter.
            <br />
            <span className="text-muted-foreground">See your progress.</span>
          </h1>
          <p className="hero-in mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "140ms" }}>
            Plan workouts, track every set, monitor your weight and understand exactly what you&apos;re eating — all in one place.
          </p>
          <div className="hero-in mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "220ms" }}>
            <PillCTA href={startHref}>Start Tracking</PillCTA>
            <PillCTA variant="ghost" onClick={explore}>
              Explore Dashboard
            </PillCTA>
          </div>
          <motion.dl className="mt-14 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight">
                  <AnimatedNumber value={s.value} duration={1.4} />
                  {s.suffix}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}
