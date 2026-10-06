"use client";
import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Droplets, Moon, Play, Plus, Scale, Sun } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { forge, useForge } from "@/store/forge-store";
import { todayKey } from "@/lib/dates";
import { toast } from "sonner";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav-items";

export const OPEN_SEARCH_EVENT = "forge:open-search";
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { plans, activeSession } = useForge();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  // Rendering 200+ (getForgeState().foods) in cmdk is fine, but only show them once the user types.
  const showData = query.trim().length > 0;
  const foodItems = useMemo(() => (showData ? (getForgeState().foods) : []), [showData]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search Forge"
      description="Search pages, workouts, (getForgeState().exercises) and (getForgeState().foods)"
      className="sm:max-w-xl"
    >
      <CommandInput placeholder="Search (getForgeState().exercises), (getForgeState().foods), workouts…" value={query} onValueChange={setQuery} />
      <CommandList className="max-h-[min(60vh,420px)]">
        <CommandEmpty>No results for “{query}”.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go(activeSession ? "/session" : "/workouts")}>
            <Play />
            {activeSession ? `Resume ${activeSession.name}` : "Start a workout"}
          </CommandItem>
          <CommandItem onSelect={() => go("/nutrition?add=1")}>
            <Plus />
            Log food
          </CommandItem>
          <CommandItem onSelect={() => go("/body?log=weight")}>
            <Scale />
            Log body weight
          </CommandItem>
          <CommandItem
            onSelect={() => {
              forge.addWater(todayKey(), 250);
              toast.success("Added 250 ml of water");
              setOpen(false);
            }}
          >
            <Droplets />
            Add 250 ml water
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Pages">
          {[...PRIMARY_NAV, ...SECONDARY_NAV].map((n) => (
            <CommandItem key={n.href} value={`page ${n.label}`} onSelect={() => go(n.href)}>
              <n.icon />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {plans.length > 0 && (
          <CommandGroup heading="Workouts">
            {plans.map((p) => (
              <CommandItem key={p.id} value={`workout ${p.name} ${p.category}`} onSelect={() => go(`/plans?edit=${p.id}`)}>
                <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                {p.name}
                <CommandShortcut>{p.exercises.length} exercises</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showData && (
          <>
            <CommandGroup heading="Exercises">
              {(getForgeState().exercises).map((e) => (
                <CommandItem
                  key={e.id}
                  value={`exercise ${e.name} ${e.muscleGroup} ${e.equipment}`}
                  onSelect={() => go(`/(getForgeState().exercises)?id=${e.id}`)}
                >
                  {e.name}
                  <CommandShortcut className="capitalize">{e.muscleGroup}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Foods">
              {foodItems.map((f) => (
                <CommandItem
                  key={f.id}
                  value={`food ${f.name} ${(f.aliases ?? []).join(" ")} ${f.category}`}
                  onSelect={() => go(`/nutrition?add=${f.id}`)}
                >
                  {f.name}
                  <CommandShortcut>{f.servingOptions[0].calories} kcal</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
