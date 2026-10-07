"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ShieldAlert,
  Sparkles,
  Zap,
  Flame,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  Cookie,
  GlassWater,
  Beef,
  IceCream,
  Pizza,
  Utensils,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/units";
import { uid } from "@/lib/ids";
import { mealForTime } from "@/lib/nutrition";
import { forge } from "@/store/forge-store";
import type { FoodLogEntry } from "@/lib/types";

interface CravingEmergencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  remainingCalories: number;
  remainingProtein?: number;
  remainingCarbs?: number;
  remainingFat?: number;
}

const CRAVING_TYPES = [
  {
    id: "sweet",
    label: "Sweet & Chocolatey",
    desc: "Chocolate, halwa, fruits, smoothies",
    icon: Cookie,
    color: "from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30",
    badge: "Most Popular",
  },
  {
    id: "salty",
    label: "Salty & Crunchy",
    desc: "Chips, roasted makhana, nuts, chana",
    icon: Pizza,
    color: "from-yellow-500/20 to-amber-500/20 text-yellow-500 border-yellow-500/30",
  },
  {
    id: "high_protein",
    label: "High-Protein Boost",
    desc: "Whey, paneer, eggs, chicken, tofu",
    icon: Beef,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30",
    badge: "Muscle Saver",
  },
  {
    id: "creamy",
    label: "Cold & Creamy",
    desc: "Greek yogurt, lassi, milkshakes",
    icon: IceCream,
    color: "from-sky-500/20 to-blue-500/20 text-sky-500 border-sky-500/30",
  },
  {
    id: "refreshing",
    label: "Refreshing Drink",
    desc: "Coconut water, juice, cold brew, lemonade",
    icon: GlassWater,
    color: "from-cyan-500/20 to-teal-500/20 text-cyan-500 border-cyan-500/30",
  },
  {
    id: "savory",
    label: "Savory & Comfort",
    desc: "Hot soups, snacks, rolls, toast",
    icon: Utensils,
    color: "from-rose-500/20 to-pink-500/20 text-rose-500 border-rose-500/30",
  },
];

export function CravingEmergencyDialog({
  open,
  onOpenChange,
  date,
  remainingCalories,
  remainingProtein = 20,
  remainingCarbs = 40,
  remainingFat = 15,
}: CravingEmergencyDialogProps) {
  const [selectedCraving, setSelectedCraving] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    cravingTitle: string;
    targetCalories: number;
    options: Array<{
      id: string;
      foodId: string;
      foodName: string;
      category: string;
      servingLabel: string;
      servingGrams: number;
      quantity: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      reason: string;
      encouragement: string;
    }>;
  } | null>(null);

  const [loggingId, setLoggingId] = useState<string | null>(null);

  const handleSelectCraving = async (typeId: string) => {
    setSelectedCraving(typeId);
    setLoading(true);
    setData(null);

    // Give visual animation feel
    try {
      const res = await forge.getRescueOptions({
        craving: typeId,
        remainingCalories: remainingCalories > 0 ? remainingCalories : 300,
        remainingProtein,
        remainingCarbs,
        remainingFat,
      });

      // Small delay for smooth UI feedback transition
      setTimeout(() => {
        setData(res);
        setLoading(false);
      }, 400);
    } catch {
      toast.error("Could not generate rescue options right now.");
      setLoading(false);
    }
  };

  const handleLogItem = async (option: NonNullable<typeof data>["options"][number]) => {
    setLoggingId(option.id);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newEntry: FoodLogEntry = {
      id: uid("foodlog"),
      foodId: option.foodId,
      date,
      time,
      meal: mealForTime(),
      foodName: option.foodName,
      servingLabel: option.servingLabel,
      servingGrams: option.servingGrams,
      quantity: option.quantity,
      calories: option.calories,
      protein: option.protein,
      carbs: option.carbs,
      fat: option.fat,
    };

    await forge.addFoodEntries([newEntry]);
    setLoggingId(null);
    toast.success(`🎉 Emergency Rescued! Logged ${option.foodName} (${option.calories} kcal)`, {
      description: "Great job satisfying your craving without exceeding your budget!",
    });

    onOpenChange(false);
    setSelectedCraving(null);
    setData(null);
  };

  const resetSelection = () => {
    setSelectedCraving(null);
    setData(null);
  };

  const displayBudget = remainingCalories > 0 ? remainingCalories : 300;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl sm:rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-rose-500/10 p-2 text-rose-500 ring-1 ring-rose-500/20">
              <ShieldAlert className="size-5 animate-pulse" />
            </span>
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-0.5 text-xs font-semibold text-rose-500 uppercase tracking-wider">
              Rescue Me 🆘
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Craving Emergency Button
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Craving something sweet or salty? Don't break your diet streak! Pick your craving and our AI will calculate exact portions to fit your remaining{" "}
            <span className="font-semibold text-foreground">{formatNumber(displayBudget)} kcal</span> budget.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 min-h-[340px]">
          <AnimatePresence mode="wait">
            {!selectedCraving ? (
              /* Step 1: Craving Selector Grid */
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select What You Are Craving:
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CRAVING_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <motion.button
                        key={type.id}
                        type="button"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectCraving(type.id)}
                        className={`group relative flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all hover:shadow-lg bg-gradient-to-br ${type.color}`}
                      >
                        <div className="rounded-xl border border-current/20 bg-background/80 p-2.5 shadow-sm">
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground">
                              {type.label}
                            </span>
                            {type.badge && (
                              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-bold text-foreground">
                                {type.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {type.desc}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : loading ? (
              /* Step 2: Processing Animation */
              <motion.div
                key="step2-loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16 text-center space-y-4"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute size-20 animate-ping rounded-full bg-rose-500/20" />
                  <div className="relative flex size-16 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-inner">
                    <Loader2 className="size-8 animate-spin" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">Calculating Macro-Matched Rescues...</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Scanning database for options that fit under your {displayBudget} kcal budget
                  </p>
                </div>
              </motion.div>
            ) : data && data.options.length > 0 ? (
              /* Step 3: Rescue Recommendations Card Stack */
              <motion.div
                key="step3-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-3.5" /> Choose another craving
                  </button>
                  <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                    <Sparkles className="size-3.5" /> 100% Macro Safe
                  </span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {data.options.map((option, idx) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-surface/60 p-4 transition-all hover:border-brand/50 hover:bg-surface hover:shadow-md"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground">
                            {option.foodName}
                          </h4>
                          <span className="num rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                            {option.servingLabel} ({option.servingGrams}g)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                          {option.reason}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-muted-foreground">
                          <span className="text-foreground font-semibold">
                            🔥 {option.calories} kcal
                          </span>
                          <span className="text-[var(--protein)]">
                            💪 {option.protein}g P
                          </span>
                          <span className="text-[var(--carbs)]">
                            🌾 {option.carbs}g C
                          </span>
                          <span className="text-[var(--fat)]">
                            🥑 {option.fat}g F
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={loggingId === option.id}
                        onClick={() => handleLogItem(option)}
                        className="sm:shrink-0 gap-1.5 shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                      >
                        {loggingId === option.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <PlusCircle className="size-3.5" />
                        )}
                        Log & Rescue
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <p className="text-center text-[11px] text-muted-foreground italic pt-1">
                  "{data.options[0]?.encouragement || "Enjoy your treat and keep your streak strong!"}"
                </p>
              </motion.div>
            ) : (
              /* Fallback if no specific options fit */
              <motion.div
                key="step3-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-3"
              >
                <div className="rounded-full bg-amber-500/10 p-3 text-amber-500">
                  <Flame className="size-6" />
                </div>
                <h3 className="text-sm font-semibold">No direct match under {displayBudget} kcal</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Try selecting another craving category or log a smaller half-portion of your favorite snack!
                </p>
                <Button variant="outline" size="sm" onClick={resetSelection} className="gap-1.5">
                  <RotateCcw className="size-3.5" /> Pick Another Craving
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
