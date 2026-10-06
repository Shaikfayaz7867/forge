"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/shared/logo";
import { Segmented } from "@/components/shared/segmented";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACTIVITY_LEVELS, ESTIMATE_DISCLAIMER, EXPERIENCE_LEVELS, GOALS, TRAINING_DAYS } from "@/data/constants";
import { calcTargets } from "@/lib/calculations";
import { ftInToCm, lbToKg } from "@/lib/units";
import { todayKey } from "@/lib/dates";
import type { ActivityLevel, Experience, Gender, Goal, HeightUnit, Profile, TrainingDays, WeightUnit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forge, useForge } from "@/store/forge-store";

const STEPS = ["About you", "Your goal", "Your training", "Your targets"] as const;

// Empty number inputs give NaN; treat that as "not provided" so our own message shows.
const optionalNum = z.preprocess((v) => (typeof v === "number" && Number.isNaN(v) ? undefined : v), z.number().optional());

const num = (msg: string) => z.number({ error: msg }).refine((n) => !Number.isNaN(n), msg);

const basicsSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(40, "Keep it under 40 characters"),
    age: num("Enter your age").pipe(z.number().int("Whole years only").min(13, "Forge is for ages 13+").max(100, "Enter a valid age")),
    gender: z.enum(["male", "female", "other"]),
    heightUnit: z.enum(["cm", "ft"]),
    heightCm: optionalNum,
    heightFt: optionalNum,
    heightIn: optionalNum,
    weightUnit: z.enum(["kg", "lb"]),
    weight: num("Enter your weight"),
  })
  .superRefine((v, ctx) => {
    const cm = v.heightUnit === "cm" ? v.heightCm : ftInToCm(v.heightFt ?? NaN, v.heightIn ?? 0);
    if (cm === undefined || Number.isNaN(cm)) {
      ctx.addIssue({ code: "custom", path: [v.heightUnit === "cm" ? "heightCm" : "heightFt"], message: "Enter your height" });
    } else if (cm < 120 || cm > 230) {
      ctx.addIssue({ code: "custom", path: [v.heightUnit === "cm" ? "heightCm" : "heightFt"], message: "Height should be between 120–230 cm (3′11″–7′6″)" });
    }
    if (v.heightUnit === "ft" && v.heightIn !== undefined && !Number.isNaN(v.heightIn) && (v.heightIn < 0 || v.heightIn >= 12)) {
      ctx.addIssue({ code: "custom", path: ["heightIn"], message: "Inches must be 0–11" });
    }
    const kg = v.weightUnit === "kg" ? v.weight : lbToKg(v.weight);
    if (!Number.isNaN(kg) && (kg < 30 || kg > 250)) {
      ctx.addIssue({ code: "custom", path: ["weight"], message: v.weightUnit === "kg" ? "Weight should be 30–250 kg" : "Weight should be 66–550 lb" });
    }
  });

type Basics = z.infer<typeof basicsSchema>;

interface Choices {
  goal: Goal;
  activity: ActivityLevel;
  trainingDays: TrainingDays;
  experience: Experience;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-[13px] text-destructive"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  name,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  name: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      name={name}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-2xl border bg-surface p-4 text-left transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.99]",
        selected ? "border-foreground/80 shadow-(--shadow-soft)" : "hover:border-foreground/25",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-brand bg-brand text-[#1a2a05]" : "border-input",
        )}
        aria-hidden
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-[13px] text-muted-foreground">{description}</span>}
      </span>
    </button>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const { hydrated, profile, isAuthenticated } = useForge();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (hydrated) {
      if (!isAuthenticated) router.replace("/login");
      else if (profile) router.replace("/dashboard");
    }
  }, [hydrated, profile, isAuthenticated, router]);
  const [dir, setDir] = useState(1);
  const [basics, setBasics] = useState<Basics | null>(null);
  const [choices, setChoices] = useState<Choices>({
    goal: "build_muscle",
    activity: "moderate",
    trainingDays: 4,
    experience: "beginner",
  });

  useEffect(() => {
    if (hydrated && profile && step === 0) router.replace("/dashboard");
  }, [hydrated, profile, router, step]);

  const form = useForm<z.input<typeof basicsSchema>, unknown, Basics>({
    resolver: zodResolver(basicsSchema),
    defaultValues: { name: "", gender: "male", heightUnit: "cm", weightUnit: "kg" },
    mode: "onTouched",
  });
  const { register, handleSubmit, watch, setValue, formState } = form;
  const heightUnit = watch("heightUnit");
  const weightUnit = watch("weightUnit");
  const gender = watch("gender");

  const draft: Profile | null = useMemo(() => {
    if (!basics) return null;
    const heightCm = basics.heightUnit === "cm" ? basics.heightCm! : ftInToCm(basics.heightFt!, basics.heightIn ?? 0);
    const weightKg = basics.weightUnit === "kg" ? basics.weight : lbToKg(basics.weight);
    return {
      name: basics.name.trim(),
      age: basics.age,
      gender: basics.gender as Gender,
      heightCm: Math.round(heightCm * 10) / 10,
      weightKg: Math.round(weightKg * 100) / 100,
      ...choices,
      calorieOverride: null,
      createdAt: new Date().toISOString(),
    };
  }, [basics, choices]);

  const targets = draft ? calcTargets(draft) : null;

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onBasics = handleSubmit((v) => {
    setBasics(v);
    go(1);
  });

  const finish = async () => {
    if (!draft || !basics) return;
    try {
      await forge.updateSettings({ weightUnit: basics.weightUnit as WeightUnit, heightUnit: basics.heightUnit as HeightUnit, demoMode: false });
      await forge.saveProfile(draft);
      await forge.addWeight(todayKey(), draft.weightKg);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to save onboarding data", err);
    }
  };const err = formState.errors;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Left rail */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r bg-surface-2/50 p-10 lg:flex">
        <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <Link href="/" className="relative" aria-label="Forge home">
          <Logo />
        </Link>
        <div className="relative space-y-8">
          <h1 className="max-w-[16ch] text-4xl leading-[1.05] font-semibold tracking-[-0.035em]">
            Set up once. Train with clarity every day after.
          </h1>
          <ol className="space-y-3" aria-label="Onboarding steps">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full border text-xs font-medium transition-colors",
                    i < step && "border-brand bg-brand text-[#1a2a05]",
                    i === step && "border-foreground bg-foreground text-background",
                    i > step && "text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={i === step ? "font-medium" : "text-muted-foreground"}>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="relative text-xs text-muted-foreground">Everything stays in this browser. No account needed.</p>
      </aside>

      {/* Form */}
      <main className="flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 lg:hidden">
          <Logo />
          <span className="num text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mx-5 mt-4 h-1 overflow-hidden rounded-full bg-muted lg:hidden" aria-hidden>
          <motion.div className="h-full origin-left rounded-full bg-brand" animate={{ scaleX: (step + 1) / STEPS.length }} />
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8 sm:py-14 lg:justify-center">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && (
                <form onSubmit={onBasics} noValidate className="space-y-7">
                  <header className="space-y-2">
                    <p className="eyebrow">Step 1 · About you</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em]">Let&apos;s get your baseline.</h2>
                    <p className="text-muted-foreground">Used to estimate your calorie and protein needs.</p>
                  </header>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" autoComplete="given-name" placeholder="What should we call you?" aria-invalid={!!err.name} aria-describedby="name-err" {...register("name")} />
                    <FieldError id="name-err" message={err.name?.message} />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" type="number" inputMode="numeric" placeholder="24" aria-invalid={!!err.age} aria-describedby="age-err" {...register("age", { valueAsNumber: true })} />
                      <FieldError id="age-err" message={err.age?.message} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium" id="gender-label">Gender</span>
                      <Segmented
                        label="Gender"
                        size="md"
                        className="flex w-full [&>button]:flex-1"
                        value={gender}
                        onChange={(v) => setValue("gender", v)}
                        options={[
                          { id: "male", label: "Male" },
                          { id: "female", label: "Female" },
                          { id: "other", label: "Other" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={heightUnit === "cm" ? "heightCm" : "heightFt"}>Height</Label>
                      <Segmented label="Height unit" value={heightUnit} onChange={(v) => setValue("heightUnit", v)} options={[{ id: "cm", label: "cm" }, { id: "ft", label: "ft / in" }]} />
                    </div>
                    {heightUnit === "cm" ? (
                      <div className="relative">
                        <Input id="heightCm" type="number" inputMode="decimal" placeholder="172" className="pr-12" aria-invalid={!!err.heightCm} aria-describedby="h-err" {...register("heightCm", { valueAsNumber: true })} />
                        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Input id="heightFt" type="number" inputMode="numeric" placeholder="5" className="pr-10" aria-label="Feet" aria-invalid={!!err.heightFt} aria-describedby="h-err" {...register("heightFt", { valueAsNumber: true })} />
                          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">ft</span>
                        </div>
                        <div className="relative">
                          <Input id="heightIn" type="number" inputMode="numeric" placeholder="8" className="pr-10" aria-label="Inches" aria-invalid={!!err.heightIn} aria-describedby="h-err" {...register("heightIn", { valueAsNumber: true })} />
                          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">in</span>
                        </div>
                      </div>
                    )}
                    <FieldError id="h-err" message={err.heightCm?.message ?? err.heightFt?.message ?? err.heightIn?.message} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weight">Weight</Label>
                      <Segmented label="Weight unit" value={weightUnit} onChange={(v) => setValue("weightUnit", v)} options={[{ id: "kg", label: "kg" }, { id: "lb", label: "lb" }]} />
                    </div>
                    <div className="relative">
                      <Input id="weight" type="number" inputMode="decimal" step="0.1" placeholder={weightUnit === "kg" ? "68" : "150"} className="pr-12" aria-invalid={!!err.weight} aria-describedby="w-err" {...register("weight", { valueAsNumber: true })} />
                      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">{weightUnit}</span>
                    </div>
                    <FieldError id="w-err" message={err.weight?.message} />
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    
                    <Button type="submit" size="lg">
                      Continue <ArrowRight data-icon="inline-end" />
                    </Button>
                  </div>
                </form>
              )}

              {step === 1 && (
                <div className="space-y-7">
                  <header className="space-y-2">
                    <p className="eyebrow">Step 2 · Goal</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em]">What are you working towards?</h2>
                    <p className="text-muted-foreground">This sets your calorie surplus or deficit. You can change it any time.</p>
                  </header>
                  <div role="radiogroup" aria-label="Fitness goal" className="grid gap-2.5 sm:grid-cols-2">
                    {GOALS.map((g) => (
                      <ChoiceCard key={g.id} name="goal" selected={choices.goal === g.id} onSelect={() => setChoices((c) => ({ ...c, goal: g.id }))} title={g.label} description={g.description} />
                    ))}
                  </div>
                  <StepNav onBack={() => go(0)} onNext={() => go(2)} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <header className="space-y-2">
                    <p className="eyebrow">Step 3 · Training</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em]">How do you move?</h2>
                  </header>
                  <fieldset className="space-y-3">
                    <legend className="mb-3 text-sm font-medium">Activity level outside the gym</legend>
                    <div role="radiogroup" aria-label="Activity level" className="grid gap-2.5 sm:grid-cols-2">
                      {ACTIVITY_LEVELS.map((a) => (
                        <ChoiceCard key={a.id} name="activity" selected={choices.activity === a.id} onSelect={() => setChoices((c) => ({ ...c, activity: a.id }))} title={a.label} description={a.description} />
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="space-y-3">
                    <legend className="mb-3 text-sm font-medium">Training days per week</legend>
                    <Segmented
                      label="Training days per week"
                      size="md"
                      className="flex w-full [&>button]:flex-1"
                      value={String(choices.trainingDays)}
                      onChange={(v) => setChoices((c) => ({ ...c, trainingDays: Number(v) as TrainingDays }))}
                      options={TRAINING_DAYS.map((d) => ({ id: String(d), label: `${d} days` }))}
                    />
                  </fieldset>
                  <fieldset className="space-y-3">
                    <legend className="mb-3 text-sm font-medium">Experience</legend>
                    <div role="radiogroup" aria-label="Experience" className="grid gap-2.5 sm:grid-cols-3">
                      {EXPERIENCE_LEVELS.map((x) => (
                        <ChoiceCard key={x.id} name="experience" selected={choices.experience === x.id} onSelect={() => setChoices((c) => ({ ...c, experience: x.id }))} title={x.label} description={x.description} />
                      ))}
                    </div>
                  </fieldset>
                  <StepNav onBack={() => go(1)} onNext={() => go(3)} nextLabel="See my targets" />
                </div>
              )}

              {step === 3 && targets && draft && (
                <div className="space-y-7">
                  <header className="space-y-2">
                    <p className="eyebrow">Step 4 · Targets</p>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em]">Here&apos;s your starting point, {draft.name}.</h2>
                    <p className="text-muted-foreground">{ESTIMATE_DISCLAIMER}</p>
                  </header>
                  <div className="surface-card overflow-hidden">
                    <div className="flex flex-col gap-1 border-b p-6">
                      <span className="text-sm text-muted-foreground">Daily calorie target</span>
                      <span className="flex items-baseline gap-2">
                        <AnimatedNumber value={targets.calories} className="text-5xl font-semibold tracking-[-0.04em]" />
                        <span className="text-muted-foreground">kcal</span>
                      </span>
                      <span className="text-[13px] text-muted-foreground">
                        Maintenance ≈ {targets.maintenance.toLocaleString()} kcal · {GOALS.find((g) => g.id === draft.goal)?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 divide-x">
                      {[
                        { label: "Protein", v: targets.protein, color: "var(--protein)" },
                        { label: "Carbs", v: targets.carbs, color: "var(--carbs)" },
                        { label: "Fat", v: targets.fat, color: "var(--fat)" },
                      ].map((m) => (
                        <div key={m.label} className="p-5">
                          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                            <span className="size-2 rounded-full" style={{ background: m.color }} aria-hidden />
                            {m.label}
                          </span>
                          <span className="num mt-1 block text-2xl font-semibold tracking-tight">{m.v}g</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 divide-x border-t bg-surface-2/40 text-center">
                      {[
                        { label: "BMI", v: targets.bmi.toFixed(1) },
                        { label: "BMR", v: `${targets.bmr.toLocaleString()}` },
                        { label: "TDEE", v: `${targets.tdee.toLocaleString()}` },
                      ].map((m) => (
                        <div key={m.label} className="px-3 py-3">
                          <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">{m.label}</span>
                          <span className="num text-sm font-medium">{m.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <StepNav onBack={() => go(2)} onNext={finish} nextLabel="Start tracking" brand />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel = "Continue", brand }: { onBack: () => void; onNext: () => void; nextLabel?: string; brand?: boolean }) {
  return (
    <div className="sticky bottom-0 -mx-5 flex items-center justify-between gap-3 border-t bg-background/90 px-5 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-2 sm:backdrop-blur-none">
      <Button variant="ghost" size="lg" onClick={onBack}>
        <ArrowLeft data-icon="inline-start" /> Back
      </Button>
      <Button size="lg" variant={brand ? "brand" : "default"} onClick={onNext}>
        {nextLabel} <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}
