"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { muscleGroups } from "@/data/constants";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExerciseImage } from "@/components/shared/exercise-image";
import { Segmented } from "@/components/shared/segmented";
import type { MuscleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | MuscleGroup;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exerciseId: string) => void;
  excludeIds?: string[];
}

export function ExercisePicker({ open, onOpenChange, onSelect, excludeIds = [] }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (getForgeState().exercises).filter(
      (e) =>
        (filter === "all" || e.muscleGroup === filter) &&
        (!q || e.name.toLowerCase().includes(q) || e.equipment.includes(q) || e.secondaryMuscles.some((m) => m.toLowerCase().includes(q))),
    );
  }, [query, filter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
          <DialogDescription>Search the library or filter by muscle group.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search (getForgeState().exercises)" className="pl-10" aria-label="Search (getForgeState().exercises)" />
        </div>
        <Segmented
          label="Muscle group"
          value={filter}
          onChange={setFilter}
          options={[{ id: "all", label: "All" }, ...muscleGroups.map((m) => ({ id: m.id, label: m.label }))]}
        />
        <ul className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2" aria-label="Exercises">
          {list.map((e) => {
            const added = excludeIds.includes(e.id);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(e.id);
                    onOpenChange(false);
                    setQuery("");
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent", added && "opacity-60")}
                >
                  <ExerciseImage exercise={e} className="size-11 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.name}</span>
                    <span className="block text-xs text-muted-foreground capitalize">
                      {e.muscleGroup} · {e.equipment}
                    </span>
                  </span>
                  {added && <span className="text-xs text-muted-foreground">Added</span>}
                </button>
              </li>
            );
          })}
          {!list.length && <li className="py-10 text-center text-sm text-muted-foreground">No (getForgeState().exercises) match “{query}”.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
