"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, Minus, Plus, Search, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Segmented } from "@/components/shared/segmented";
import { MEALS, NUTRITION_DISCLAIMER } from "@/data/constants";
import { buildEntry, mealLabel, parseSmartInput, scaleServing, searchFoods } from "@/lib/nutrition";
import type { Food, MealType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forge, useForge, foodById, getForgeState } from "@/store/forge-store";

const CATEGORY_CHIPS = ["Breakfast", "Rice", "Curries", "Protein", "Snacks", "Dairy", "Fruits", "Nuts & Seeds", "Drinks", "Breads", "Sweets", "Vegetables"];

type Mode = "search" | "type";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  defaultMeal: MealType;
  initialFoodId?: string | null;
}

function MacroLine({ calories, protein, carbs, fat, className }: { calories: number; protein: number; carbs: number; fat: number; className?: string }) {
  return (
    <p className={cn("num flex flex-wrap gap-x-3 text-xs text-muted-foreground", className)}>
      <span className="font-medium text-foreground">{Math.round(calories)} kcal</span>
      <span>P {protein}g</span>
      <span>C {carbs}g</span>
      <span>F {fat}g</span>
    </p>
  );
}

export function AddFoodDialog({ open, onOpenChange, date, defaultMeal, initialFoodId }: Props) {
  const { foodLogs } = useForge();
  // State initialises from props; the parent re-keys this component each time it opens.
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Food | null>(() => (initialFoodId ? foodById(getForgeState())[initialFoodId] ?? null : null));
  const [servingIdx, setServingIdx] = useState(0);
  const [qtyText, setQtyText] = useState("1");
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [smart, setSmart] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);


  const results = useMemo(() => {
    const base = searchFoods(query, 60);
    return category ? base.filter((f) => f.category === category) : base;
  }, [query, category]);

  const quantity = parseFloat(qtyText);
  const qtyValid = !Number.isNaN(quantity) && quantity > 0 && quantity <= 50;
  const serving = selected?.servingOptions[servingIdx];
  const preview = serving && qtyValid ? scaleServing(serving, quantity) : null;

  const duplicate = useMemo(
    () => (selected && serving ? foodLogs.find((f) => f.date === date && f.meal === meal && f.foodId === selected.id && f.servingLabel === serving.label) : undefined),
    [foodLogs, selected, serving, date, meal],
  );

  const parsed = useMemo(() => parseSmartInput(smart), [smart]);
  const parsedOk = parsed.filter((p) => p.ok);

  const close = () => onOpenChange(false);

  const addSelected = (combine = false) => {
    if (!selected || !serving) return;
    if (!qtyValid) {
      toast.error("Enter a quantity between 0.1 and 50");
      return;
    }
    if (combine && duplicate) {
      const q = duplicate.quantity + quantity;
      forge.updateFoodEntry(duplicate.id, { quantity: q, ...scaleServing(serving, q) });
      toast.success(`Updated ${selected.name}`, { description: `${q} × ${serving.label} at ${mealLabel(meal)}` });
    } else {
      forge.addFoodEntries([buildEntry(selected, serving, quantity, meal, date)]);
      toast.success(`Added ${selected.name} to ${mealLabel(meal)}`, { description: `${preview?.calories ?? 0} kcal · ${preview?.protein ?? 0}g protein` });
    }
    close();
  };

  const addParsed = () => {
    if (!parsedOk.length) {
      toast.error("Nothing to add yet", { description: "Try something like “2 idli, 1 cup sambar”." });
      return;
    }
    const entries = parsedOk.map((p) => (p.ok ? buildEntry(p.food, p.serving, p.quantity, meal, date) : null)).filter((e) => e !== null);
    forge.addFoodEntries(entries);
    const kcal = entries.reduce((s, e) => s + e.calories, 0);
    toast.success(`Added ${entries.length} ${entries.length === 1 ? "item" : "items"} to ${mealLabel(meal)}`, { description: `${kcal} kcal` });
    setSmart("");
    close();
  };

  const searchFor = (q: string) => {
    setMode("search");
    setSelected(null);
    setQuery(q);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-auto bottom-0 flex h-[92dvh] max-h-[92dvh] translate-y-0 flex-col gap-0 rounded-b-none p-0 sm:top-1/2 sm:bottom-auto sm:h-[min(720px,88dvh)] sm:-translate-y-1/2 sm:rounded-b-3xl sm:max-w-lg">
        <DialogHeader className="space-y-3 border-b px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 pr-8">
            {selected && mode === "search" && (
              <Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)} aria-label="Back to results">
                <ArrowLeft />
              </Button>
            )}
            <DialogTitle>{selected && mode === "search" ? selected.name : "Add food"}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Search the food database or type what you ate.</DialogDescription>
          {!selected && (
            <Segmented
              label="Input mode"
              size="md"
              className="flex w-full [&>button]:flex-1"
              value={mode}
              onChange={setMode}
              options={[
                { id: "search", label: "Search" },
                { id: "type", label: "Type it" },
              ]}
            />
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "search" && !selected && (
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 px-5 py-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    ref={searchRef}
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="idli, dosa, chicken, curd…"
                    className="pr-10 pl-10"
                    aria-label="Search foods"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" aria-label="Clear search">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 scrollbar-none" role="group" aria-label="Filter by category">
                  {CATEGORY_CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={category === c}
                      onClick={() => setCategory(category === c ? null : c)}
                      className={cn(
                        "h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors",
                        category === c ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <ul aria-label="Food results" className="-mx-2">
                  {results.map((f) => {
                    const s = f.servingOptions[0];
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(f);
                            setServingIdx(0);
                            setQtyText("1");
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{f.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {s.label} · {f.category}
                            </span>
                          </span>
                          <span className="num shrink-0 text-right text-sm">
                            {s.calories}
                            <span className="text-xs text-muted-foreground"> kcal</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {!results.length && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium">We couldn&apos;t find “{query}”.</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try a simpler name, like “dosa” or “rice”.</p>
                  </div>
                )}
              </motion.div>
            )}

            {mode === "search" && selected && serving && (
              <motion.div key="detail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6 px-5 py-5">
                <p className="text-xs text-muted-foreground">
                  {selected.category} · {selected.cuisine}
                </p>
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">Serving</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.servingOptions.map((s, i) => (
                      <button
                        key={s.label + i}
                        type="button"
                        aria-pressed={servingIdx === i}
                        onClick={() => setServingIdx(i)}
                        className={cn(
                          "h-9 rounded-full border px-3.5 text-[13px] transition-colors",
                          servingIdx === i ? "border-foreground bg-foreground text-background" : "hover:border-foreground/30",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <label htmlFor="qty" className="text-sm font-medium">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon-lg" onClick={() => setQtyText(String(Math.max(0.5, (qtyValid ? quantity : 1) - 0.5)))} aria-label="Decrease quantity">
                      <Minus />
                    </Button>
                    <Input
                      id="qty"
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      value={qtyText}
                      onChange={(e) => setQtyText(e.target.value)}
                      aria-invalid={!qtyValid}
                      aria-describedby="qty-err"
                      className="num h-12 flex-1 text-center text-lg font-semibold"
                    />
                    <Button variant="outline" size="icon-lg" onClick={() => setQtyText(String(Math.min(50, (qtyValid ? quantity : 0) + 0.5)))} aria-label="Increase quantity">
                      <Plus />
                    </Button>
                  </div>
                  {!qtyValid && (
                    <p id="qty-err" role="alert" className="text-[13px] text-destructive">
                      Enter a quantity between 0.1 and 50.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Meal</span>
                  <Segmented label="Meal" className="flex w-full [&>button]:flex-1" value={meal} onChange={setMeal} options={MEALS.map((m) => ({ id: m.id, label: m.label }))} />
                </div>

                <AnimatePresence>
                  {preview && (
                    <motion.div layout className="grid grid-cols-4 gap-2 rounded-2xl bg-surface-2/60 p-4 text-center">
                      {[
                        { l: "kcal", v: preview.calories, c: "var(--foreground)" },
                        { l: "Protein", v: `${preview.protein}g`, c: "var(--protein)" },
                        { l: "Carbs", v: `${preview.carbs}g`, c: "var(--carbs)" },
                        { l: "Fat", v: `${preview.fat}g`, c: "var(--fat)" },
                      ].map((x) => (
                        <div key={x.l}>
                          <motion.p key={String(x.v)} initial={{ y: 4, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className="num text-lg font-semibold">
                            {x.v}
                          </motion.p>
                          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                            <span className="size-1.5 rounded-full" style={{ background: x.c }} aria-hidden />
                            {x.l}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {duplicate && (
                  <div className="flex gap-3 rounded-2xl border border-warning/40 bg-[color-mix(in_oklab,var(--warning),transparent_90%)] p-3 text-sm" role="status">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    <p>
                      You already logged {duplicate.quantity} × {selected.name} at {mealLabel(meal).toLowerCase()} today. Add it again, or combine into one entry?
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">{NUTRITION_DISCLAIMER}</p>
              </motion.div>
            )}

            {mode === "type" && !selected && (
              <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 px-5 py-4">
                <div className="space-y-2">
                  <label htmlFor="smart" className="flex items-center gap-1.5 text-sm font-medium">
                    <Sparkles className="size-4 text-brand-ink" aria-hidden /> Type what you ate
                  </label>
                  <Textarea
                    id="smart"
                    autoFocus
                    value={smart}
                    onChange={(e) => setSmart(e.target.value)}
                    rows={4}
                    placeholder={"2 idli\n3 eggs\n150g chicken breast, 1 banana"}
                    className="num text-[15px]"
                  />
                  <p className="text-xs text-muted-foreground">One item per line or separated by commas. Quantities in pieces, cups or grams.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Meal</span>
                  <Segmented label="Meal" className="flex w-full [&>button]:flex-1" value={meal} onChange={setMeal} options={MEALS.map((m) => ({ id: m.id, label: m.label }))} />
                </div>
                {parsed.length > 0 && (
                  <ul className="space-y-2" aria-live="polite">
                    {parsed.map((p, i) =>
                      p.ok ? (
                        <motion.li key={i + p.raw} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 rounded-xl border bg-surface p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p.food.name}
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {p.serving.grams === 100 && /^100/.test(p.serving.label) ? `${Math.round(p.quantity * 100)}${p.serving.label.includes("ml") ? "ml" : "g"}` : `${p.quantity} × ${p.serving.label}`}
                              </span>
                            </p>
                            <MacroLine {...p.macros} />
                          </div>
                        </motion.li>
                      ) : (
                        <li key={i + p.raw} className="rounded-xl border border-dashed p-3 text-sm">
                          <p>
                            {p.reason === "invalid_quantity" ? (
                              <>That quantity looks off for “{p.raw}”.</>
                            ) : (
                              <>We couldn&apos;t find “{p.query}”.</>
                            )}
                          </p>
                          {p.reason === "not_found" && (
                            <button type="button" className="mt-1 text-[13px] font-medium text-brand-ink underline underline-offset-4" onClick={() => searchFor(p.query)}>
                              Search food database
                            </button>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {(selected || mode === "type") && (
          <div className="flex gap-2 border-t px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] sm:pb-4">
            {mode === "type" && !selected ? (
              <Button size="lg" className="flex-1" onClick={addParsed} disabled={!parsedOk.length}>
                Add {parsedOk.length || ""} {parsedOk.length === 1 ? "item" : "items"} to {mealLabel(meal)}
              </Button>
            ) : duplicate ? (
              <>
                <Button size="lg" variant="outline" className="flex-1" onClick={() => addSelected(true)} disabled={!qtyValid}>
                  Combine
                </Button>
                <Button size="lg" className="flex-1" onClick={() => addSelected(false)} disabled={!qtyValid}>
                  Add anyway
                </Button>
              </>
            ) : (
              <Button size="lg" className="flex-1" onClick={() => addSelected(false)} disabled={!qtyValid}>
                Add to {mealLabel(meal)}
                {preview ? ` · ${preview.calories} kcal` : ""}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
