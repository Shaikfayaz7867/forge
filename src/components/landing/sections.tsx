"use client";

import { motion } from "motion/react";
import { Check, Dumbbell, Info, LineChart, Utensils } from "lucide-react";
import { useState } from "react";
import { ExerciseProgressChart, WeightChart } from "@/components/charts/charts";
import { BeforeAfterSlider } from "@/components/shared/before-after-slider";
import { MacroBar } from "@/components/shared/macro-bar";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Segmented } from "@/components/shared/segmented";
import { Slider } from "@/components/ui/slider";
import { NUTRITION_DISCLAIMER } from "@/data/constants";
import { PILLARS, PREVIEW_EXERCISE, PREVIEW_FOODS, PREVIEW_MEALS, PREVIEW_STRENGTH, PREVIEW_WEIGHT, PREVIEW_WORKOUT } from "@/data/landing";
import { cn } from "@/lib/utils";
import { Bezel, Eyebrow, PillCTA, Reveal } from "./primitives";
import { useStartHref } from "./use-start";

function SectionHeading({ eyebrow, title, body, className }: { eyebrow: string; title: React.ReactNode; body?: string; className?: string }) {
  return (
    <Reveal className={cn("max-w-2xl", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 text-4xl leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">{title}</h2>
      {body && <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">{body}</p>}
    </Reveal>
  );
}

/* ---------------------------------- Problem ---------------------------------- */

export function ProblemSection() {
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <SectionHeading
          eyebrow="The problem"
          title={
            <>
              Most people track workouts and food separately.{" "}
              <span className="text-muted-foreground">Your progress depends on both.</span>
            </>
          }
          body="Lifting heavier needs enough fuel. Losing fat needs enough protein to keep the strength. When the numbers live in different apps, you never see the connection."
        />
        <Reveal delay={0.1}>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              { icon: Dumbbell, label: "Training app", lines: ["Bench 50 kg × 8", "Volume 4,250 kg"] },
              { icon: Utensils, label: "Calorie app", lines: ["1,720 kcal", "62g protein"] },
            ].map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ rotate: i ? 2 : -2 }}
                whileInView={{ rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="rounded-3xl border border-dashed p-5"
              >
                <b.icon className="size-5 text-muted-foreground" strokeWidth={1.6} aria-hidden />
                <p className="mt-4 text-xs text-muted-foreground">{b.label}</p>
                {b.lines.map((l) => (
                  <p key={l} className="num mt-1 text-sm font-medium">
                    {l}
                  </p>
                ))}
              </motion.div>
            ))}
            <div className="col-span-2">
              <Bezel innerClassName="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                    <LineChart className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium">Forge connects them:</span>{" "}
                    <span className="text-muted-foreground">“Protein was below target on 4 of the last 7 days — the same week your bench stalled.”</span>
                  </p>
                </div>
              </Bezel>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------- Pillars ---------------------------------- */

export function PillarsSection() {
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeading eyebrow="One product" title="Three things you need. Nothing you don't." />
        <div className="mt-14 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
          {PILLARS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className={cn(i === 0 ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5")}>
              <a href={`#${p.id}`} className="group block h-full">
                <Bezel className="h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1" innerClassName="flex h-full flex-col justify-between gap-10 p-7 sm:p-9">
                  <div>
                    <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{p.eyebrow}</p>
                    <h3 className={cn("mt-4 font-semibold tracking-[-0.03em]", i === 0 ? "text-3xl sm:text-4xl" : "text-2xl")}>{p.title}</h3>
                    <p className="mt-3 max-w-[44ch] leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                  {i === 0 ? (
                    <div className="grid max-w-xl grid-cols-14 gap-1.5" aria-hidden>
                      {Array.from({ length: 28 }, (_, d) => {
                        const level = [0, 2, 3, 0, 1, 3, 0, 2, 3, 0, 3, 2, 0, 1, 3, 2, 0, 3, 1, 0, 2, 3, 3, 0, 2, 1, 0, 3][d];
                        return (
                          <motion.span
                            key={d}
                            initial={{ opacity: 0, scale: 0.6 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + d * 0.015, type: "spring", stiffness: 300, damping: 20 }}
                            className={cn(
                              "aspect-square rounded-md",
                              ["bg-surface-2", "bg-[color-mix(in_oklab,var(--brand),transparent_72%)]", "bg-[color-mix(in_oklab,var(--brand),transparent_45%)]", "bg-brand"][level],
                            )}
                          />
                        );
                      })}
                    </div>
                  ) : i === 1 ? (
                    <div className="flex flex-wrap gap-1.5" aria-hidden>
                      {PREVIEW_FOODS.slice(0, 7).map((f) => (
                        <span key={f} className="rounded-full border bg-surface-2/50 px-3 py-1 text-xs">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <svg viewBox="0 0 200 50" className="h-12 w-full" aria-hidden>
                      <motion.path d="M0 45 L30 40 L55 42 L80 32 L110 28 L135 20 L160 18 L200 6" fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
                    </svg>
                  )}
                </Bezel>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Workout preview ------------------------------ */

function InteractiveWorkoutCard() {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)} tabIndex={0} className="rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Workout preview: Push Day. Hover to complete sets.">
      <Bezel innerClassName="p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold tracking-tight">{PREVIEW_WORKOUT.name}</p>
          <p className="text-xs text-muted-foreground">{hover ? "Logging…" : "Hover to log sets"}</p>
        </div>
        <div className="mt-5 space-y-5">
          {PREVIEW_WORKOUT.exercises.map((ex, ei) => (
            <div key={ex.id}>
              <div className="flex items-baseline justify-between">
                <p className="font-medium">{ex.name}</p>
                <p className="num text-xs text-muted-foreground">Previous {ex.previous}</p>
              </div>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {ex.sets.map((s, si) => {
                  const order = ei * 3 + si;
                  return (
                    <li key={si} className="relative overflow-hidden rounded-xl border bg-surface-2/40 px-3 py-2.5">
                      <motion.span
                        className="absolute inset-0 origin-left bg-brand-soft"
                        initial={false}
                        animate={{ scaleX: hover ? 1 : 0 }}
                        transition={{ delay: hover ? order * 0.09 : 0, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className="num text-sm">
                          <span className="font-semibold">{s.w}</span>
                          <span className="text-muted-foreground"> × {s.r}</span>
                        </span>
                        <motion.span initial={false} animate={{ scale: hover ? 1 : 0, opacity: hover ? 1 : 0 }} transition={{ delay: hover ? order * 0.09 + 0.15 : 0, type: "spring", stiffness: 500, damping: 18 }} className="grid size-5 place-items-center rounded-full bg-brand text-[#1a2a05]">
                          <Check className="size-3" strokeWidth={3} />
                        </motion.span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Bezel>
    </div>
  );
}

function InteractiveExerciseCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="group" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Bezel innerClassName="relative overflow-hidden p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{PREVIEW_EXERCISE.muscle}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{PREVIEW_EXERCISE.name}</p>
            <p className="text-sm text-muted-foreground">{PREVIEW_EXERCISE.equipment}</p>
          </div>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Show exercise details" className="grid size-9 place-items-center rounded-full border">
            <Info className="size-4" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {PREVIEW_EXERCISE.stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-surface-2/60 p-3">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="num text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
        <motion.div
          initial={false}
          animate={{ y: open ? 0 : "100%", opacity: open ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="absolute inset-x-0 bottom-0 bg-foreground p-6 text-background"
          aria-hidden={!open}
        >
          <p className="text-[11px] tracking-[0.14em] uppercase opacity-60">Form cue</p>
          <p className="mt-1 text-sm leading-relaxed">{PREVIEW_EXERCISE.cue}</p>
        </motion.div>
      </Bezel>
    </div>
  );
}

export function WorkoutPreviewSection() {
  return (
    <section id="workouts" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="Workout tracking"
            title="Log a set in one tap. See last week beside it."
            body="Weight and reps pre-filled from your last session, a rest timer that starts itself, and a big Complete Set button where your thumb already is."
          />
          <Reveal delay={0.1}>
            <InteractiveExerciseCard />
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <InteractiveWorkoutCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Nutrition preview ------------------------------ */

function FoodMarquee() {
  const items = [...PREVIEW_FOODS, ...PREVIEW_FOODS];
  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]" aria-label="Foods in the database">
      <motion.ul className="flex w-max gap-2" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
        {items.map((f, i) => (
          <li key={i} aria-hidden={i >= PREVIEW_FOODS.length} className="rounded-full border bg-surface px-4 py-2 text-sm whitespace-nowrap">
            {f}
          </li>
        ))}
      </motion.ul>
    </div>
  );
}

function CalorieSlider() {
  const target = 2500;
  const [eaten, setEaten] = useState(1640);
  const ratio = eaten / target;
  return (
    <Bezel innerClassName="p-6 sm:p-8">
      <div className="flex flex-col items-center gap-8 sm:flex-row">
        <ProgressRing value={eaten} max={target} size={168} stroke={13} label={`${eaten} of ${target} kcal`}>
          <div>
            <p className="num text-3xl font-semibold tracking-tight">{eaten.toLocaleString()}</p>
            <p className="num text-xs text-muted-foreground">/ {target.toLocaleString()} kcal</p>
          </div>
        </ProgressRing>
        <div className="w-full flex-1 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">{eaten <= target ? "Remaining" : "Over"}</span>
            <span className="num text-xl font-semibold">{Math.abs(target - eaten).toLocaleString()} kcal</span>
          </div>
          <MacroBar label="Protein" value={Math.round(110 * ratio * 0.95)} target={110} color="var(--protein)" />
          <MacroBar label="Carbs" value={Math.round(300 * ratio)} target={300} color="var(--carbs)" />
          <MacroBar label="Fat" value={Math.round(80 * ratio * 1.02)} target={80} color="var(--fat)" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <label htmlFor="cal-slider" className="text-xs text-muted-foreground">
          Drag to see your day fill up
        </label>
        <Slider id="cal-slider" min={0} max={3000} step={10} value={[eaten]} onValueChange={([v]) => setEaten(v)} aria-label="Calories eaten" />
      </div>
    </Bezel>
  );
}

export function NutritionPreviewSection() {
  return (
    <section id="nutrition" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <SectionHeading
          eyebrow="Nutrition tracking"
          title="Built for idli, dosa and everything in between."
          body="Over two hundred Indian and South Indian foods with real serving sizes — 1 idli, 1 dosa, 1 cup of sambar, 1 plate of biryani. Or just type what you ate."
        />
      </div>
      <div className="mt-12">
        <FoodMarquee />
      </div>
      <div className="mx-auto mt-12 grid max-w-[1240px] gap-4 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <CalorieSlider />
        </Reveal>
        <Reveal delay={0.1}>
          <Bezel innerClassName="p-6 sm:p-7">
            <div className="rounded-2xl border border-dashed px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Type it</p>
              <p className="num mt-0.5 font-mono text-sm">3 idli, 2 eggs, 1 banana</p>
            </div>
            <div className="mt-5 space-y-5">
              {PREVIEW_MEALS.map((m) => (
                <div key={m.meal}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold">
                      {m.meal} <span className="num ml-1 text-xs font-normal text-muted-foreground">{m.time}</span>
                    </p>
                    <p className="num text-xs text-muted-foreground">
                      {m.items.reduce((s, i) => s + i.kcal, 0)} kcal · {m.items.reduce((s, i) => s + i.protein, 0)}g protein
                    </p>
                  </div>
                  <ul className="mt-2 divide-y">
                    {m.items.map((i, idx) => (
                      <motion.li key={i.name} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + idx * 0.08 }} className="flex justify-between py-2 text-sm">
                        <span>
                          {i.name} <span className="text-muted-foreground">· {i.qty}</span>
                        </span>
                        <span className="num">{i.kcal} kcal</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11px] text-muted-foreground">{NUTRITION_DISCLAIMER}</p>
          </Bezel>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- Progress preview ------------------------------- */

function Silhouette({ broad }: { broad?: boolean }) {
  // Abstract figure; the "after" state has broader shoulders, arms and chest.
  const s = broad ? 1 : 0;
  return (
    <svg viewBox="0 0 200 250" className={cn("size-full", broad ? "bg-[color-mix(in_oklab,var(--brand),var(--surface-2)_88%)]" : "bg-surface-2")} aria-hidden>
      <g transform="translate(40 30) scale(0.6)" className={broad ? "fill-[color-mix(in_oklab,var(--brand),var(--foreground)_25%)]" : "fill-foreground/25"}>
        <circle cx="100" cy="30" r="22" />
        <path d={`M${58 - s * 12} 70 Q100 ${58 - s * 4} ${142 + s * 12} 70 L${128 + s * 6} 160 Q100 168 ${72 - s * 6} 160 Z`} />
        <rect x={34 - s * 14} y="74" width={18 + s * 6} height="86" rx="9" />
        <rect x={148 + s * 8} y="74" width={18 + s * 6} height="86" rx="9" />
        <rect x="70" y="164" width={27 + s * 3} height="120" rx="12" />
        <rect x={103 - s * 3} y="164" width={27 + s * 3} height="120" rx="12" />
      </g>
    </svg>
  );
}

export function ProgressPreviewSection() {
  const [view, setView] = useState<"weight" | "strength">("strength");
  return (
    <section id="progress" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeading eyebrow="Progress analytics" title="Am I actually getting stronger? Now you'll know." body="Hover the chart. Every point is a real session — top set, estimated 1RM, body weight — so the trend is never a guess." />
        <div className="mt-14 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <Bezel innerClassName="p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{view === "strength" ? "Bench Press · top set" : "Body weight"}</p>
                  <p className="num text-2xl font-semibold tracking-tight">{view === "strength" ? "40 → 50 kg" : "54.6 → 56.1 kg"}</p>
                </div>
                <Segmented label="Chart" value={view} onChange={setView} options={[{ id: "strength", label: "Strength" }, { id: "weight", label: "Weight" }]} />
              </div>
              <div className="mt-5">
                {view === "strength" ? (
                  <ExerciseProgressChart data={PREVIEW_STRENGTH} dataKey="value" label="Top set" unit="kg" height={260} />
                ) : (
                  <WeightChart data={PREVIEW_WEIGHT} unit="kg" height={260} />
                )}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-5 text-sm">
                {[
                  { l: "Calories avg", v: "2,410 kcal" },
                  { l: "Protein avg", v: "104 g" },
                  { l: "Consistency", v: "4 / 5 weekly" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-xs text-muted-foreground">{s.l}</p>
                    <p className="num font-semibold">{s.v}</p>
                  </div>
                ))}
              </div>
            </Bezel>
          </Reveal>
          <Reveal delay={0.1}>
            <Bezel innerClassName="flex h-full flex-col p-5 sm:p-7">
              <p className="text-sm font-medium">Before / after</p>
              <p className="text-xs text-muted-foreground">Drag to compare. Real progress photos stay on your device.</p>
              <BeforeAfterSlider className="mt-4 aspect-[4/5] w-full rounded-2xl" beforeLabel="Aug 1" afterLabel="Oct 2" before={<Silhouette />} after={<Silhouette broad />} initial={45} />
            </Bezel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------ CTA ------------------------------------ */

export function CTASection() {
  const startHref = useStartHref();
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-32">
      <Reveal className="mx-auto max-w-[1240px]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground px-6 py-20 text-background sm:px-14 sm:py-24">
          <div aria-hidden className="pointer-events-none absolute -top-40 -right-24 size-[520px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand),transparent_70%),transparent)]" />
          <div className="relative max-w-2xl">
            <h2 className="text-4xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl">Your next workout starts here.</h2>
            <p className="mt-5 max-w-[44ch] text-lg text-background/65">Set up in under a minute. No account, no sync, no ads — just your training and your food, in one place.</p>
            <div className="mt-9">
              <PillCTA href={startHref} className="bg-background text-foreground hover:bg-background/90">
                Start Tracking
              </PillCTA>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Forge is a local-first fitness tracker. Your data stays in your browser.</p>
        <p>Calorie values are estimates · Exercise photos: free-exercise-db (public domain)</p>
      </div>
    </footer>
  );
}
