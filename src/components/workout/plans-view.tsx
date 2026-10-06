"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { AnimatePresence, motion } from "motion/react";
import { Copy, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUrlTrigger } from "@/hooks/use-url-trigger";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";

import { uid } from "@/lib/ids";
import { WEEKDAY_SHORT } from "@/lib/planning";
import { formatWeight } from "@/lib/units";
import type { WorkoutPlan } from "@/lib/types";
import { forge, useForge } from "@/store/forge-store";
import { CategoryBadge } from "./category-badge";
import { emptyDraft, PlanEditor, type PlanDraft } from "./plan-editor";

function PlanCard({ plan, onEdit, onDelete, onStart }: { plan: WorkoutPlan; onEdit: () => void; onDelete: () => void; onStart: () => void }) {
  const { settings } = useForge();
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => plan.scheduledDays.includes(d));
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="surface-card flex flex-col p-5 transition-shadow hover:shadow-(--shadow-lift)"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-tight">{plan.name}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {plan.exercises.length} exercises · {plan.exercises.reduce((s, e) => s + e.sets, 0)} sets
            {days.length > 0 && ` · ${days.map((d) => WEEKDAY_SHORT[d]).join(", ")}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <CategoryBadge category={plan.category} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${plan.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit / rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  forge.duplicatePlan(plan.id);
                  toast.success(`Duplicated ${plan.name}`);
                }}
              >
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ol className="mt-4 flex-1 divide-y text-sm">
        {plan.exercises.map((pe) => (
          <li key={pe.id} className="flex items-center justify-between gap-3 py-2">
            <span className="truncate">{exerciseById(getForgeState())[pe.exerciseId]?.name}</span>
            <span className="num shrink-0 text-muted-foreground">
              {pe.sets} × {pe.repMin === pe.repMax ? pe.repMax : `${pe.repMin}–${pe.repMax}`}
              {pe.targetWeight ? ` · ${formatWeight(pe.targetWeight, settings.weightUnit)}` : ""}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={onStart}>
          <Play data-icon="inline-start" /> Start
        </Button>
        <Button variant="outline" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </motion.article>
  );
}

export function PlansView() {
  const { plans, settings, activeSession } = useForge();
  const router = useRouter();
  const [editor, setEditor] = useState<{ open: boolean; draft: PlanDraft; key: number }>({ open: false, draft: emptyDraft(), key: 0 });
  const [toDelete, setToDelete] = useState<WorkoutPlan | null>(null);

  const openEditor = (draft: PlanDraft) => setEditor((e) => ({ open: true, draft, key: e.key + 1 }));

  useUrlTrigger("new", () => openEditor(emptyDraft()));
  useUrlTrigger("edit", (id) => {
    const p = plans.find((x) => x.id === id);
    if (p) openEditor(p);
  });

  const start = (plan: WorkoutPlan) => {
    if (activeSession) {
      toast.error("Finish or discard your current workout first", { action: { label: "Resume", onClick: () => router.push("/session") } });
      return;
    }
    forge.startSession(plan);
    router.push("/session");
  };

  const fromTemplate = (id: string) => {
    const t = getForgeState().workoutTemplates.find((x: any) => x.id === id)!;
    openEditor({
      name: t.name,
      category: t.category,
      notes: t.description,
      scheduledDays: t.scheduledDays,
      exercises: t.exercises.map((e) => ({ ...e, id: uid("pe"), notes: "" })),
    });
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Planner"
        title="Workout plans"
        description="Build the routines you repeat each week. Reorder exercises, set targets and rest times."
        actions={
          <Button size="lg" onClick={() => openEditor(emptyDraft())}>
            <Plus data-icon="inline-start" /> New workout
          </Button>
        }
      />

      {plans.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} onEdit={() => openEditor(p)} onDelete={() => setToDelete(p)} onStart={() => start(p)} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="surface-card">
          <EmptyState
            icon={Plus}
            title="No workouts yet."
            description="Your first workout is waiting. Start from a template below or build your own."
            action={<Button onClick={() => openEditor(emptyDraft())}>Create Workout</Button>}
          />
        </div>
      )}

      <section className="space-y-4">
        <SectionTitle title="Start from a template" description="Copied into an editable plan — tweak anything." />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-6">
          {getForgeState().workoutTemplates.map((t: any) => (
            <button
              key={t.id}
              type="button"
              onClick={() => fromTemplate(t.id)}
              className="group w-[220px] shrink-0 snap-start rounded-2xl border bg-surface p-4 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-(--shadow-lift) sm:w-auto"
            >
              <CategoryBadge category={t.category} />
              <p className="mt-3 font-medium">{t.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
              <p className="num mt-3 text-xs text-muted-foreground">{t.exercises.length} exercises</p>
            </button>
          ))}
        </div>
      </section>

      <PlanEditor
        key={editor.key}
        open={editor.open}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        initial={editor.draft}
        unit={settings.weightUnit}
        defaultRest={settings.defaultRestSec}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="The plan is removed. Workouts you've already logged with it stay in your history."
        confirmLabel="Delete plan"
        destructive
        onConfirm={() => {
          if (toDelete) {
            forge.deletePlan(toDelete.id);
            toast.success(`Deleted ${toDelete.name}`);
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}
