"use client";

import { format } from "date-fns";
import { Download, RotateCcw, Sparkles, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LogoMark } from "@/components/shared/logo";
import { PageHeader } from "@/components/shared/page-header";
import { Segmented } from "@/components/shared/segmented";
import { REST_PRESETS } from "@/data/constants";
import { storageUsageBytes } from "@/lib/storage";
import { forge, useForge } from "@/store/forge-store";

function Row({ title, description, children, htmlFor }: { title: string; description?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {title}
        </label>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card px-5 py-2 sm:px-7" aria-labelledby={`g-${title}`}>
      <h2 id={`g-${title}`} className="pt-4 text-[15px] font-semibold">
        {title}
      </h2>
      <div className="divide-y">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const { settings, history, foodLogs, weights, photos, storageAvailable } = useForge();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const mounted = useMounted();
  const [confirm, setConfirm] = useState<null | "reset" | "demo" | "fresh" | "import">(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [water, setWater] = useState(String(settings.waterGoalMl / 1000));
  const fileRef = useRef<HTMLInputElement>(null);

  const usage = mounted ? storageUsageBytes() : 0;

  const exportData = () => {
    const data = forge.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forge-export-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded", { description: `${history.length} workouts · ${foodLogs.length} food entries · ${weights.length} weigh-ins` });
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("That file is too large to be a Forge export");
      return;
    }
    const text = await file.text();
    setPendingImport(text);
    setConfirm("import");
    if (fileRef.current) fileRef.current.value = "";
  };

  const runImport = async () => {
    if (!pendingImport) return;
    const res = await forge.importData(pendingImport);
    setPendingImport(null);
    if (res.ok) toast.success("Data imported", { description: "Everything was restored from your file." });
    else toast.error("Import failed", { description: res.error });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Preferences & data" />

      {!storageAvailable && (
        <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Local storage isn&apos;t available in this browser session (private mode can cause this). Changes won&apos;t be saved after you close the tab.
        </div>
      )}

      <Group title="Appearance">
        <Row title="Theme" description="Follow your device or pick one">
          {mounted && (
            <Segmented
              label="Theme"
              value={(theme as "light" | "dark" | "system") ?? "system"}
              onChange={setTheme}
              options={[
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
                { id: "system", label: "System" },
              ]}
            />
          )}
        </Row>
      </Group>

      <Group title="Units">
        <Row title="Weight" description="Body weight and lifting loads">
          <Segmented label="Weight unit" value={settings.weightUnit} onChange={(v) => forge.updateSettings({ weightUnit: v })} options={[{ id: "kg", label: "kg" }, { id: "lb", label: "lb" }]} />
        </Row>
        <Row title="Height & measurements" description="Centimetres, or feet/inches">
          <Segmented label="Height unit" value={settings.heightUnit} onChange={(v) => forge.updateSettings({ heightUnit: v })} options={[{ id: "cm", label: "cm" }, { id: "ft", label: "ft / in" }]} />
        </Row>
      </Group>

      <Group title="Training & hydration">
        <Row title="Default rest" description="Used for exercises added during a workout">
          <Segmented
            label="Default rest"
            value={String(settings.defaultRestSec)}
            onChange={(v) => forge.updateSettings({ defaultRestSec: Number(v) })}
            options={REST_PRESETS.map((s) => ({ id: String(s), label: `${s}s` }))}
          />
        </Row>
        <Row title="Daily water goal" htmlFor="water-goal">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const l = parseFloat(water);
              if (Number.isNaN(l) || l < 0.5 || l > 8) {
                toast.error("Enter a goal between 0.5 and 8 litres");
                return;
              }
              forge.updateSettings({ waterGoalMl: Math.round(l * 1000) });
              toast.success(`Water goal set to ${l}L`);
            }}
          >
            <div className="relative">
              <Input id="water-goal" type="number" step="0.25" inputMode="decimal" value={water} onChange={(e) => setWater(e.target.value)} className="num w-28 pr-7" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">L</span>
            </div>
            <Button type="submit" variant="outline">
              Save
            </Button>
          </form>
        </Row>
      </Group>

      <Group title="Notifications">
        <p className="pt-1 text-[13px] text-muted-foreground">In-app only. Forge never sends push notifications or emails.</p>
        {(
          [
            { key: "restTimerSound", title: "Rest timer sound", description: "A short beep and vibration when rest ends" },
            { key: "prCelebrations", title: "PR celebrations", description: "Highlight new personal records after a workout" },
            { key: "workoutReminders", title: "Workout reminders", description: "Show a reminder on the dashboard for scheduled days" },
          ] as const
        ).map((n) => (
          <Row key={n.key} title={n.title} description={n.description} htmlFor={`n-${n.key}`}>
            <Switch
              id={`n-${n.key}`}
              checked={settings.notifications[n.key]}
              onCheckedChange={(checked) => forge.updateSettings({ notifications: { ...settings.notifications, [n.key]: checked } })}
            />
          </Row>
        ))}
      </Group>

      <Group title="Data">
        <Row title="Export data" description="Download everything as a JSON file — your backup">
          <Button variant="outline" onClick={exportData}>
            <Download data-icon="inline-start" /> Export
          </Button>
        </Row>
        <Row title="Import data" description="Restore from a Forge export. Replaces current data.">
          <>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onImportFile(e.target.files?.[0])} aria-label="Choose export file" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload data-icon="inline-start" /> Import
            </Button>
          </>
        </Row>
        <Row title="Demo mode" description={settings.demoMode ? "You're viewing generated demo data." : "Load realistic sample data to explore."}>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirm("demo")}>
              <Sparkles data-icon="inline-start" /> Load demo data
            </Button>
            <Button variant="ghost" onClick={() => setConfirm("fresh")}>
              <RotateCcw data-icon="inline-start" /> Start fresh
            </Button>
          </div>
        </Row>
        <Row title="Reset all data" description="Permanently delete everything stored by Forge in this browser">
          <Button variant="destructive" onClick={() => setConfirm("reset")}>
            <Trash2 data-icon="inline-start" /> Reset
          </Button>
        </Row>
        <p className="num py-3 text-xs text-muted-foreground">
          Using about {(usage / 1024).toFixed(0)} KB of browser storage{photos.length ? ` (${photos.length} photos)` : ""}.
        </p>
      </Group>

      <section className="surface-card flex items-start gap-4 p-5 sm:p-7">
        <LogoMark className="size-10" />
        <div>
          <h2 className="text-[15px] font-semibold">About Forge</h2>
          <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
            Forge is a local-first fitness tracker. Your data stays in your browser. Calorie, macro and body calculations are estimates, not medical advice. Exercise photos from free-exercise-db (public domain).
          </p>
        </div>
      </section>

      <ConfirmDialog
        open={confirm === "reset"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete all Forge data?"
        description="Your profile, workouts, food logs, weights, measurements and photos will be permanently removed from this browser. Export first if you want a backup."
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => {
          forge.resetAll();
          toast("All data deleted");
          router.push("/");
        }}
      />
      
      <ConfirmDialog
        open={confirm === "fresh"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Start fresh?"
        description="All current data is removed and you'll set up a new profile."
        confirmLabel="Start fresh"
        destructive
        onConfirm={() => {
          forge.startFresh();
          router.push("/onboarding");
        }}
      />
      <ConfirmDialog
        open={confirm === "import"}
        onOpenChange={(o) => {
          if (!o) {
            setConfirm(null);
            setPendingImport(null);
          }
        }}
        title="Replace your data with this file?"
        description="Everything currently in Forge will be replaced by the contents of the export."
        confirmLabel="Import"
        onConfirm={runImport}
      />
    </div>
  );
}
