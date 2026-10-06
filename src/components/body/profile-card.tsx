"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionTitle } from "@/components/shared/page-header";
import { Segmented } from "@/components/shared/segmented";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { ACTIVITY_LEVELS, ESTIMATE_DISCLAIMER, EXPERIENCE_LEVELS, GOALS, TRAINING_DAYS } from "@/data/constants";
import { bmiCategory, calcTargets } from "@/lib/calculations";
import { cmToFtIn, ftInToCm, fromDisplayWeight, toDisplayWeight } from "@/lib/units";
import { todayKey } from "@/lib/dates";
import type { ActivityLevel, Experience, Gender, Goal, Profile, TrainingDays } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forge, useForge } from "@/store/forge-store";

function Field({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="h-11! w-full rounded-xl" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Editable body profile. Inputs follow the chosen display units; storage is always metric. */
export function ProfileCard() {
  const { profile, settings } = useForge();
  const p = profile!;
  const { weightUnit, heightUnit } = settings;
  const ftIn = cmToFtIn(p.heightCm);

  const [form, setForm] = useState({
    name: p.name,
    age: String(p.age),
    gender: p.gender,
    goal: p.goal,
    activity: p.activity,
    trainingDays: String(p.trainingDays),
    experience: p.experience,
    cm: String(Math.round(p.heightCm)),
    ft: String(ftIn.ft),
    inch: String(ftIn.inch),
    weight: String(toDisplayWeight(p.weightKg, weightUnit)),
  });
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const heightCm = heightUnit === "cm" ? parseFloat(form.cm) : ftInToCm(parseFloat(form.ft), parseFloat(form.inch || "0"));
  const weightKg = fromDisplayWeight(parseFloat(form.weight), weightUnit);
  const age = parseInt(form.age, 10);

  const errors = {
    name: !form.name.trim() ? "Enter your name" : null,
    age: Number.isNaN(age) || age < 13 || age > 100 ? "Enter an age between 13 and 100" : null,
    height: Number.isNaN(heightCm) || heightCm < 120 || heightCm > 230 ? "Enter a height between 120–230 cm (3′11″–7′6″)" : null,
    weight: Number.isNaN(weightKg) || weightKg < 30 || weightKg > 250 ? `Enter a weight between ${weightUnit === "kg" ? "30–250 kg" : "66–550 lb"}` : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  // Switching units converts the values already typed so nothing is lost.
  const switchHeight = (u: "cm" | "ft") => {
    if (u === heightUnit) return;
    if (u === "ft" && !Number.isNaN(heightCm)) {
      const c = cmToFtIn(heightCm);
      setForm((f) => ({ ...f, ft: String(c.ft), inch: String(c.inch) }));
    } else if (u === "cm" && !Number.isNaN(heightCm)) set("cm", String(Math.round(heightCm)));
    forge.updateSettings({ heightUnit: u });
  };
  const switchWeight = (u: "kg" | "lb") => {
    if (u === weightUnit) return;
    if (!Number.isNaN(weightKg)) set("weight", String(toDisplayWeight(weightKg, u)));
    forge.updateSettings({ weightUnit: u });
  };

  const save = () => {
    setSubmitted(true);
    if (hasErrors) {
      toast.error("Check the highlighted fields");
      return;
    }
    const weightChanged = Math.abs(weightKg - p.weightKg) >= 0.05;
    const next: Partial<Profile> = {
      name: form.name.trim(),
      age,
      gender: form.gender as Gender,
      goal: form.goal as Goal,
      activity: form.activity as ActivityLevel,
      trainingDays: Number(form.trainingDays) as TrainingDays,
      experience: form.experience as Experience,
      heightCm: Math.round(heightCm * 10) / 10,
      weightKg: Math.round(weightKg * 100) / 100,
    };
    forge.updateProfile(next);
    if (weightChanged) forge.addWeight(todayKey(), Math.round(weightKg * 100) / 100);
    toast.success("Profile updated", { description: "Your targets have been recalculated." });
  };

  return (
    <section className="surface-card p-5 sm:p-7" aria-labelledby="profile-title">
      <SectionTitle title="Body profile" description="Used for your calorie and macro estimates" />
      <h2 id="profile-title" className="sr-only">
        Body profile
      </h2>
      <form
        className="mt-6 space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="p-name" error={submitted ? errors.name : null}>
            <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={submitted && !!errors.name} />
          </Field>
          <Field label="Age" htmlFor="p-age" error={submitted ? errors.age : null}>
            <Input id="p-age" type="number" inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} aria-invalid={submitted && !!errors.age} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={heightUnit === "cm" ? "p-cm" : "p-ft"}>Height</Label>
              <Segmented label="Height unit" value={heightUnit} onChange={switchHeight} options={[{ id: "cm", label: "cm" }, { id: "ft", label: "ft/in" }]} />
            </div>
            {heightUnit === "cm" ? (
              <div className="relative">
                <Input id="p-cm" type="number" inputMode="decimal" value={form.cm} onChange={(e) => set("cm", e.target.value)} aria-invalid={submitted && !!errors.height} className="pr-12" />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input id="p-ft" type="number" inputMode="numeric" aria-label="Feet" value={form.ft} onChange={(e) => set("ft", e.target.value)} aria-invalid={submitted && !!errors.height} className="pr-9" />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">ft</span>
                </div>
                <div className="relative">
                  <Input type="number" inputMode="numeric" aria-label="Inches" value={form.inch} onChange={(e) => set("inch", e.target.value)} className="pr-9" />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">in</span>
                </div>
              </div>
            )}
            {submitted && errors.height && (
              <p role="alert" className="text-[13px] text-destructive">
                {errors.height}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="p-weight">Weight</Label>
              <Segmented label="Weight unit" value={weightUnit} onChange={switchWeight} options={[{ id: "kg", label: "kg" }, { id: "lb", label: "lb" }]} />
            </div>
            <div className="relative">
              <Input id="p-weight" type="number" inputMode="decimal" step="0.1" value={form.weight} onChange={(e) => set("weight", e.target.value)} aria-invalid={submitted && !!errors.weight} className="pr-12" />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">{weightUnit}</span>
            </div>
            {submitted && errors.weight && (
              <p role="alert" className="text-[13px] text-destructive">
                {errors.weight}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Gender" value={form.gender} onChange={(v) => set("gender", v)} options={[{ id: "male", label: "Male" }, { id: "female", label: "Female" }, { id: "other", label: "Other" }]} />
          <SelectField label="Goal" value={form.goal} onChange={(v) => set("goal", v)} options={GOALS} />
          <SelectField label="Activity level" value={form.activity} onChange={(v) => set("activity", v)} options={ACTIVITY_LEVELS} />
          <SelectField label="Training days / week" value={form.trainingDays} onChange={(v) => set("trainingDays", v)} options={TRAINING_DAYS.map((d) => ({ id: String(d), label: `${d} days` }))} />
          <SelectField label="Experience" value={form.experience} onChange={(v) => set("experience", v)} options={EXPERIENCE_LEVELS} />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save profile</Button>
        </div>
      </form>
    </section>
  );
}

export function TargetsCard() {
  const { profile } = useForge();
  const p = profile!;
  const t = calcTargets(p);
  const [override, setOverride] = useState(p.calorieOverride ? String(p.calorieOverride) : "");
  const overrideNum = parseInt(override, 10);
  const overrideValid = !Number.isNaN(overrideNum) && overrideNum >= 1000 && overrideNum <= 6000;
  const cat = bmiCategory(t.bmi);

  const rows = [
    { label: "BMI", value: t.bmi.toFixed(1), sub: cat.label },
    { label: "BMR", value: `${t.bmr.toLocaleString()} kcal`, sub: "Mifflin-St Jeor" },
    { label: "TDEE", value: `${t.tdee.toLocaleString()} kcal`, sub: "BMR × activity" },
    { label: "Maintenance", value: `${t.maintenance.toLocaleString()} kcal`, sub: "Est. to hold weight" },
  ];

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="targets-title">
      <div className="p-5 sm:p-7">
        <SectionTitle title="Daily targets" description="Estimates — adjust based on how your body responds" />
        <h2 id="targets-title" className="sr-only">
          Daily targets
        </h2>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted-foreground">{t.isOverride ? "Custom calorie target" : `Goal target · ${GOALS.find((g) => g.id === p.goal)?.label}`}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <AnimatedNumber value={t.calories} className="text-5xl font-semibold tracking-[-0.04em]" />
              <span className="text-muted-foreground">kcal</span>
            </p>
          </div>
          {t.isOverride && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                forge.updateProfile({ calorieOverride: null });
                setOverride("");
                toast.success("Using the calculated target again");
              }}
            >
              <RotateCcw data-icon="inline-start" /> Use calculated ({t.calculatedCalories.toLocaleString()})
            </Button>
          )}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Protein", v: t.protein, c: "var(--protein)" },
            { label: "Carbs", v: t.carbs, c: "var(--carbs)" },
            { label: "Fat", v: t.fat, c: "var(--fat)" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-surface-2/60 p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: m.c }} aria-hidden />
                {m.label}
              </p>
              <p className="num mt-1 text-xl font-semibold">{m.v}g</p>
            </div>
          ))}
        </div>
        <form
          className="mt-6 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!overrideValid) {
              toast.error("Enter a target between 1,000 and 6,000 kcal");
              return;
            }
            forge.updateProfile({ calorieOverride: overrideNum });
            toast.success(`Calorie target set to ${overrideNum.toLocaleString()} kcal`);
          }}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="override">Manual calorie target</Label>
            <Input id="override" type="number" inputMode="numeric" placeholder={String(t.calculatedCalories)} value={override} onChange={(e) => setOverride(e.target.value)} className="num" aria-invalid={!!override && !overrideValid} />
          </div>
          <Button type="submit" variant="outline" className="h-11">
            Set
          </Button>
        </form>
      </div>
      <dl className="grid grid-cols-2 divide-x divide-y border-t sm:grid-cols-4 sm:divide-y-0">
        {rows.map((r) => (
          <div key={r.label} className="p-4">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className={cn("num mt-1 font-semibold", r.label === "BMI" && cat.tone !== "ok" && "text-warning")}>{r.value}</dd>
            <dd className="text-[11px] text-muted-foreground">{r.sub}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t bg-surface-2/40 px-5 py-3 text-xs text-muted-foreground sm:px-7">{ESTIMATE_DISCLAIMER}</p>
    </section>
  );
}
