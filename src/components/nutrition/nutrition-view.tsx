"use client";

import { addDays, format, isToday as isTodayFn } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, ShieldAlert, Trash2, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import { useUrlTrigger } from "@/hooks/use-url-trigger";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { EmptyState } from "@/components/shared/empty-state";
import { MacroBar } from "@/components/shared/macro-bar";
import { SectionTitle } from "@/components/shared/page-header";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Segmented } from "@/components/shared/segmented";
import { CaloriesChart, MacroTrendChart } from "@/components/charts/charts";
import { MEALS, NUTRITION_DISCLAIMER } from "@/data/constants";
import { useTargets, useToday } from "@/hooks/use-forge-derived";
import { fromDateKey, lastNDays, toDateKey } from "@/lib/dates";
import { formatServing, mealForTime, sumMacros } from "@/lib/nutrition";
import { macrosByDay } from "@/lib/summaries";
import { formatNumber } from "@/lib/units";
import type { FoodLogEntry, MealType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forge, useForge } from "@/store/forge-store";
import { AddFoodDialog } from "./add-food-dialog";
import { EditEntryDialog } from "./edit-entry-dialog";
import { WaterTracker } from "./water-tracker";
import { CravingEmergencyDialog } from "./craving-emergency-dialog";

function FoodRow({ entry, onEdit }: { entry: FoodLogEntry; onEdit: () => void }) {
  const remove = async () => {
    const removed = await forge.removeFoodEntry(entry.id);
    toast(`Removed ${entry.foodName}`, {
      action: removed ? { label: "Undo", onClick: () => forge.addFoodEntries([removed]) } : undefined,
    });
  };
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="group flex items-center gap-3 py-3"
    >
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left" aria-label={`Edit ${entry.foodName}`}>
        <p className="truncate text-sm font-medium">{entry.foodName}</p>
        <p className="num truncate text-xs text-muted-foreground">
          {formatServing(entry)} · {entry.time}
        </p>
      </button>
      <div className="num shrink-0 text-right">
        <p className="text-sm font-medium">{formatNumber(entry.calories)} kcal</p>
        <p className="text-xs text-muted-foreground">{Math.round(entry.protein)}g protein</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Options for ${entry.foodName}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit quantity
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={remove}>
            <Trash2 /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  );
}

type Trend = "7" | "30";

export function NutritionView() {
  const { foodLogs } = useForge();
  const targets = useTargets()!;
  const today = useToday();
  const [date, setDate] = useState(today);
  const [dialog, setDialog] = useState<{ open: boolean; meal: MealType; foodId: string | null; key: number }>({ open: false, meal: "breakfast", foodId: null, key: 0 });
  const [editing, setEditing] = useState<FoodLogEntry | null>(null);
  const [trend, setTrend] = useState<Trend>("7");
  const [rescueOpen, setRescueOpen] = useState(false);

  const openDialog = (meal: MealType, foodId: string | null = null) => setDialog((d) => ({ open: true, meal, foodId, key: d.key + 1 }));
  useUrlTrigger("add", (add) => openDialog(mealForTime(), add === "1" ? null : add));

  const entries = useMemo(() => foodLogs.filter((f) => f.date === date).sort((a, b) => a.time.localeCompare(b.time)), [foodLogs, date]);
  const totals = sumMacros(entries);
  const remaining = targets.calories - totals.calories;

  const byMeal = useMemo(() => MEALS.map((m) => ({ ...m, items: entries.filter((e) => e.meal === m.id) })), [entries]);
  const timeline = useMemo(
    () =>
      byMeal
        .filter((m) => m.items.length)
        .map((m) => ({ meal: m.label, time: m.items[0].time, calories: m.items.reduce((s, x) => s + x.calories, 0) }))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [byMeal],
  );

  const trendDays = useMemo(() => macrosByDay({ foodLogs }, lastNDays(trend === "7" ? 7 : 30, fromDateKey(today))), [foodLogs, today, trend]);
  const isToday = date === today;
  const openAdd = (meal: MealType = isToday ? mealForTime() : "lunch") => openDialog(meal);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="eyebrow">Nutrition</p>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.025em] sm:text-[32px]">{isToday ? "Today's Nutrition" : format(fromDateKey(date), "EEEE, MMM d")}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-full border bg-surface p-0.5">
            <Button variant="ghost" size="icon-sm" onClick={() => setDate(toDateKey(addDays(fromDateKey(date), -1)))} aria-label="Previous day">
              <ChevronLeft />
            </Button>
            <button type="button" onClick={() => setDate(today)} className="num min-w-24 px-2 text-center text-[13px] font-medium" aria-label="Jump to today">
              {isTodayFn(fromDateKey(date)) ? "Today" : format(fromDateKey(date), "MMM d")}
            </button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDate(toDateKey(addDays(fromDateKey(date), 1)))} disabled={date >= today} aria-label="Next day">
              <ChevronRight />
            </Button>
          </div>
          <Button
            size="lg"
            onClick={() => setRescueOpen(true)}
            className="border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-600 font-semibold shadow-sm transition-all"
          >
            <ShieldAlert data-icon="inline-start" className="animate-pulse" /> Craving Rescue 🆘
          </Button>
          <Button size="lg" className="hidden sm:inline-flex" onClick={() => openAdd()}>
            <Plus data-icon="inline-start" /> Add food
          </Button>
        </div>
      </header>

      {/* Calories + macros + water */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="surface-card p-5 sm:p-7" aria-label="Calories and macros">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <ProgressRing value={totals.calories} max={targets.calories} size={196} stroke={14} label={`${Math.round(totals.calories)} of ${targets.calories} kcal eaten`}>
              <div>
                <AnimatedNumber value={totals.calories} className="block text-[40px] leading-none font-semibold tracking-[-0.04em]" />
                <span className="num mt-1.5 block text-xs text-muted-foreground">/ {formatNumber(targets.calories)} kcal</span>
              </div>
            </ProgressRing>
            <div className="w-full flex-1 space-y-5">
              <div className="flex items-baseline justify-between border-b pb-4">
                <span className="text-sm text-muted-foreground">{remaining >= 0 ? "Remaining" : "Over target"}</span>
                <span className={cn("num text-2xl font-semibold tracking-tight", remaining < 0 && "text-warning")}>
                  <AnimatedNumber value={Math.abs(remaining)} /> <span className="text-sm font-normal text-muted-foreground">kcal</span>
                </span>
              </div>
              <MacroBar label="Protein" value={totals.protein} target={targets.protein} color="var(--protein)" />
              <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color="var(--carbs)" />
              <MacroBar label="Fat" value={totals.fat} target={targets.fat} color="var(--fat)" />
            </div>
          </div>
        </section>
        <div className="grid gap-4">
          <section className="surface-card p-5 sm:p-6">
            <WaterTracker date={date} />
          </section>
          <section className="surface-card p-5 sm:p-6">
            <SectionTitle title="Timeline" />
            {timeline.length ? (
              <ol className="relative mt-4 space-y-4 border-l pl-5">
                {timeline.map((t) => (
                  <li key={t.meal} className="relative">
                    <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-surface bg-brand" aria-hidden />
                    <div className="flex items-baseline justify-between gap-3">
                      <span>
                        <span className="num mr-3 text-xs text-muted-foreground">{t.time}</span>
                        <span className="text-sm font-medium">{t.meal}</span>
                      </span>
                      <span className="num text-sm">{formatNumber(t.calories)} kcal</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Meals appear here in the order you ate them.</p>
            )}
          </section>
        </div>
      </div>

      {/* Meals */}
      {entries.length === 0 ? (
        <section className="surface-card">
          <EmptyState
            icon={Utensils}
            title={isToday ? "Nothing logged today." : "Nothing logged this day."}
            description="Start with your next meal. Try typing “2 idli, 1 cup sambar”."
            action={
              <Button size="lg" onClick={() => openAdd()}>
                <Plus data-icon="inline-start" /> Add food
              </Button>
            }
          />
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {byMeal.map((m) => {
            const t = sumMacros(m.items);
            if (!m.items.length && m.id === "other") return null;
            return (
              <section key={m.id} className="surface-card p-5" aria-labelledby={`meal-${m.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 id={`meal-${m.id}`} className="text-[15px] font-semibold">
                      {m.label}
                    </h2>
                    <p className="num text-xs text-muted-foreground">
                      {m.items.length ? `${formatNumber(t.calories)} kcal · ${Math.round(t.protein)}g protein` : "Not logged"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openAdd(m.id)} aria-label={`Add food to ${m.label}`}>
                    <Plus data-icon="inline-start" /> Add
                  </Button>
                </div>
                {m.items.length > 0 && (
                  <ul className="mt-2 divide-y">
                    <AnimatePresence initial={false}>
                      {m.items.map((e) => (
                        <FoodRow key={e.id} entry={e} onEdit={() => setEditing(e)} />
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Calories" description={`Daily intake vs ${formatNumber(targets.calories)} kcal target`} action={<Segmented label="Range" value={trend} onChange={setTrend} options={[{ id: "7", label: "7D" }, { id: "30", label: "30D" }]} />} />
          <div className="mt-4">
            {trendDays.some((d) => d.logged) ? <CaloriesChart data={trendDays} target={targets.calories} /> : <EmptyState compact icon={Utensils} title="No data yet" />}
          </div>
        </section>
        <section className="surface-card p-5 sm:p-6">
          <SectionTitle title="Protein" description={`Daily protein vs ${targets.protein}g target`} />
          <div className="mt-4">
            {trendDays.some((d) => d.logged) ? (
              <MacroTrendChart data={trendDays} dataKey="protein" target={targets.protein} color="var(--protein)" label="Protein" height={220} />
            ) : (
              <EmptyState compact icon={Utensils} title="No data yet" />
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-muted-foreground">{NUTRITION_DISCLAIMER}</p>

      {/* Mobile FAB */}
      <div className="fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 sm:hidden">
        <Button size="lg" className="h-12 rounded-full px-5 shadow-(--shadow-lift)" onClick={() => openAdd()}>
          <Plus data-icon="inline-start" /> Add Food
        </Button>
      </div>

      <AddFoodDialog key={dialog.key} open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} date={date} defaultMeal={dialog.meal} initialFoodId={dialog.foodId} />
      {editing && <EditEntryDialog key={editing.id} entry={editing} onClose={() => setEditing(null)} />}
      <CravingEmergencyDialog
        open={rescueOpen}
        onOpenChange={setRescueOpen}
        date={date}
        remainingCalories={remaining}
        remainingProtein={targets.protein - totals.protein}
        remainingCarbs={targets.carbs - totals.carbs}
        remainingFat={targets.fat - totals.fat}
      />
    </div>
  );
}
