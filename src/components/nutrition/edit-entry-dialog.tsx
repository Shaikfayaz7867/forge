"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/shared/segmented";
import { MEALS } from "@/data/constants";
import { scaleServing } from "@/lib/nutrition";
import type { FoodLogEntry, MealType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forge, foodById, getForgeState } from "@/store/forge-store";

export function EditEntryDialog({ entry, onClose }: { entry: FoodLogEntry; onClose: () => void }) {
  const food = foodById(getForgeState())[entry.foodId];
  const initialIdx = Math.max(0, food?.servingOptions.findIndex((s: any) => s.label === entry.servingLabel) ?? 0);
  const [servingIdx, setServingIdx] = useState(initialIdx);
  const [qty, setQty] = useState(String(entry.quantity));
  const [meal, setMeal] = useState<MealType>(entry.meal);
  const [time, setTime] = useState(entry.time);

  const quantity = parseFloat(qty);
  const valid = !Number.isNaN(quantity) && quantity > 0 && quantity <= 50;
  const serving = food?.servingOptions[servingIdx];
  const macros = serving && valid ? scaleServing(serving, quantity) : null;

  const save = () => {
    if (!valid || !serving) {
      toast.error("Enter a quantity between 0.1 and 50");
      return;
    }
    forge.updateFoodEntry(entry.id, {
      quantity,
      meal,
      time,
      servingLabel: serving.label,
      servingGrams: serving.grams,
      ...scaleServing(serving, quantity),
    });
    toast.success(`Updated ${entry.foodName}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry.foodName}</DialogTitle>
          <DialogDescription>Adjust the serving, quantity or meal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {food && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Serving">
              {food.servingOptions.map((s: any, i: number) => (
                <button
                  key={s.label + i}
                  type="button"
                  aria-pressed={servingIdx === i}
                  onClick={() => setServingIdx(i)}
                  className={cn("h-9 rounded-full border px-3.5 text-[13px]", servingIdx === i ? "border-foreground bg-foreground text-background" : "hover:border-foreground/30")}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-qty">Quantity</Label>
              <Input id="edit-qty" type="number" inputMode="decimal" step={0.5} value={qty} onChange={(e) => setQty(e.target.value)} aria-invalid={!valid} className="num" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Time</Label>
              <Input id="edit-time" type="time" value={time} onChange={(e) => setTime(e.target.value || entry.time)} className="num" />
            </div>
          </div>
          {!valid && <p className="text-[13px] text-destructive" role="alert">Enter a quantity between 0.1 and 50.</p>}
          <Segmented label="Meal" className="flex w-full [&>button]:flex-1" value={meal} onChange={setMeal} options={MEALS.map((m) => ({ id: m.id, label: m.label }))} />
          {macros && (
            <p className="num rounded-xl bg-surface-2/60 px-4 py-3 text-sm">
              <span className="font-semibold">{macros.calories} kcal</span>
              <span className="text-muted-foreground"> · P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g</span>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
