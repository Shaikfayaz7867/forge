"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { Reorder, useDragControls } from "motion/react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseImage } from "@/components/shared/exercise-image";
import { EmptyState } from "@/components/shared/empty-state";
import { WORKOUT_CATEGORIES } from "@/data/constants";
import { WEEKDAY_SHORT } from "@/lib/planning";
import { uid } from "@/lib/ids";
import { fromDisplayWeight, toDisplayWeight } from "@/lib/units";
import type { PlannedExercise, WeightUnit, WorkoutCategory, WorkoutPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forge } from "@/store/forge-store";
import { ExercisePicker } from "./exercise-picker";

export type PlanDraft = Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt"> & { id?: string };

export const emptyDraft = (): PlanDraft => ({ name: "", category: "custom", exercises: [], notes: "", scheduledDays: [] });

const clampInt = (v: string, min: number, max: number) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? min : Math.min(max, Math.max(min, n));
};

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
  invalid,
}: {
  label: string;
  value: number | "";
  onChange: (v: string) => void;
  suffix?: string;
  step?: number;
  invalid?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="relative block">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={cn("num h-10 px-3", suffix && "pr-9")}
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  );
}

function ExerciseRow({
  pe,
  index,
  total,
  unit,
  onChange,
  onRemove,
  onMove,
}: {
  pe: PlannedExercise;
  index: number;
  total: number;
  unit: WeightUnit;
  onChange: (patch: Partial<PlannedExercise>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const controls = useDragControls();
  const ex = exerciseById(getForgeState())[pe.exerciseId];
  const repsInvalid = pe.repMin > pe.repMax;
  return (
    <Reorder.Item value={pe} dragListener={false} dragControls={controls} className="list-none">
      <div className="rounded-2xl border bg-surface p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            className="hidden cursor-grab touch-none text-muted-foreground active:cursor-grabbing sm:block"
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </button>
          {ex && <ExerciseImage exercise={ex} className="size-10 shrink-0 rounded-lg" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{ex?.name ?? pe.exerciseId}</p>
            <p className="text-xs text-muted-foreground capitalize">{ex?.muscleGroup}</p>
          </div>
          <div className="flex items-center">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${ex?.name} up`}>
              <ChevronUp />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${ex?.name} down`}>
              <ChevronDown />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove ${ex?.name}`}>
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          <NumberField label="Sets" value={pe.sets} onChange={(v) => onChange({ sets: clampInt(v, 1, 10) })} />
          <NumberField label="Reps min" value={pe.repMin} invalid={repsInvalid} onChange={(v) => onChange({ repMin: clampInt(v, 1, 100) })} />
          <NumberField label="Reps max" value={pe.repMax} invalid={repsInvalid} onChange={(v) => onChange({ repMax: clampInt(v, 1, 100) })} />
          <NumberField
            label="Target"
            suffix={unit}
            step={0.5}
            value={pe.targetWeight === null ? "" : toDisplayWeight(pe.targetWeight, unit)}
            onChange={(v) => {
              const n = parseFloat(v);
              onChange({ targetWeight: v === "" || Number.isNaN(n) ? null : Math.min(500, Math.max(0, fromDisplayWeight(n, unit))) });
            }}
          />
          <NumberField label="Rest" suffix="s" step={15} value={pe.restSec} onChange={(v) => onChange({ restSec: clampInt(v, 0, 600) })} />
        </div>
        {repsInvalid && <p className="mt-2 text-xs text-destructive">Minimum reps can&apos;t be higher than maximum.</p>}
        <Input value={pe.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Notes (optional)" aria-label={`Notes for ${ex?.name}`} className="mt-2 h-9 text-sm" maxLength={140} />
      </div>
    </Reorder.Item>
  );
}

export function PlanEditor({
  open,
  onOpenChange,
  initial,
  unit,
  defaultRest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PlanDraft;
  unit: WeightUnit;
  defaultRest: number;
}) {
  const [draft, setDraft] = useState<PlanDraft>(initial);
  const [picker, setPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nameError = !draft.name.trim() ? "Give this workout a name" : draft.name.length > 40 ? "Keep it under 40 characters" : null;
  const exerciseError = draft.exercises.length === 0 ? "Add at least one exercise" : null;
  const repsError = draft.exercises.some((e) => e.repMin > e.repMax);

  const update = (id: string, patch: Partial<PlannedExercise>) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const move = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const list = [...d.exercises];
      const [item] = list.splice(index, 1);
      list.splice(index + dir, 0, item);
      return { ...d, exercises: list };
    });

  const save = () => {
    setSubmitted(true);
    if (nameError || exerciseError || repsError) {
      toast.error(exerciseError && !nameError ? "A workout needs at least one exercise" : "Fix the highlighted fields first");
      return;
    }
    const payload = { ...draft, name: draft.name.trim() };
    if (draft.id) {
      forge.updatePlan(draft.id, payload);
      toast.success(`Saved ${payload.name}`);
    } else {
      forge.createPlan(payload);
      toast.success(`Created ${payload.name}`);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl! data-[side=right]:w-full">
        <SheetHeader className="border-b px-5 py-4 sm:px-6">
          <SheetTitle>{draft.id ? "Edit workout" : "New workout"}</SheetTitle>
          <SheetDescription>Exercises, sets, reps, target weights and rest.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Push Day"
                aria-invalid={submitted && !!nameError}
                aria-describedby="plan-name-err"
              />
              {submitted && nameError && (
                <p id="plan-name-err" className="text-[13px] text-destructive" role="alert">
                  {nameError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as WorkoutCategory })}>
                <SelectTrigger className="h-11! w-full rounded-xl" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKOUT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Scheduled days</legend>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const on = draft.scheduledDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setDraft({ ...draft, scheduledDays: on ? draft.scheduledDays.filter((x) => x !== d) : [...draft.scheduledDays, d] })
                    }
                    className={cn(
                      "h-9 min-w-12 rounded-full border px-3 text-xs font-medium transition-colors",
                      on ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {WEEKDAY_SHORT[d]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Exercises <span className="num text-muted-foreground">({draft.exercises.length})</span>
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setPicker(true)}>
                <Plus data-icon="inline-start" /> Add exercise
              </Button>
            </div>
            {draft.exercises.length ? (
              <Reorder.Group axis="y" values={draft.exercises} onReorder={(list) => setDraft({ ...draft, exercises: list })} className="space-y-2.5">
                {draft.exercises.map((pe, i) => (
                  <ExerciseRow
                    key={pe.id}
                    pe={pe}
                    index={i}
                    total={draft.exercises.length}
                    unit={unit}
                    onChange={(patch) => update(pe.id, patch)}
                    onRemove={() => setDraft({ ...draft, exercises: draft.exercises.filter((e) => e.id !== pe.id) })}
                    onMove={(dir) => move(i, dir)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              <div className={cn("rounded-2xl border border-dashed", submitted && exerciseError && "border-destructive/60")}>
                <EmptyState compact icon={Plus} title="No exercises yet" description="Add the movements for this workout." action={<Button size="sm" onClick={() => setPicker(true)}>Add exercise</Button>} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-notes">Notes</Label>
            <Textarea id="plan-notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Warm-up, cues, anything to remember" rows={3} maxLength={400} />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-5 py-4 sm:px-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{draft.id ? "Save changes" : "Create workout"}</Button>
        </SheetFooter>

        <ExercisePicker
          open={picker}
          onOpenChange={setPicker}
          excludeIds={draft.exercises.map((e) => e.exerciseId)}
          onSelect={(exerciseId) =>
            setDraft((d) => ({
              ...d,
              exercises: [
                ...d.exercises,
                { id: uid("pe"), exerciseId, sets: 3, repMin: 8, repMax: 12, targetWeight: null, restSec: defaultRest, notes: "" },
              ],
            }))
          }
        />
      </SheetContent>
    </Sheet>
  );
}
