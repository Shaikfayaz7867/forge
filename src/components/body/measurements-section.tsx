"use client";

import { format } from "date-fns";
import { ArrowRight, Plus, Ruler, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionTitle } from "@/components/shared/page-header";
import { MEASUREMENTS } from "@/data/constants";
import { fromDateKey } from "@/lib/dates";
import { formatLength, fromDisplayLength, lengthUnitLabel, toDisplayLength } from "@/lib/units";
import type { MeasurementKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forge, useForge } from "@/store/forge-store";

function AddMeasurementDialog({ open, onOpenChange, today }: { open: boolean; onOpenChange: (o: boolean) => void; today: string }) {
  const { settings, measurements } = useForge();
  const unit = settings.heightUnit;
  const last = measurements.at(-1);
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<MeasurementKey, string>>(() =>
    Object.fromEntries(MEASUREMENTS.map((m) => [m.id, last?.values[m.id] ? String(toDisplayLength(last.values[m.id]!, unit)) : ""])) as Record<MeasurementKey, string>,
  );

  const parsed = MEASUREMENTS.map((m) => ({ id: m.id, raw: values[m.id], n: parseFloat(values[m.id]) }));
  const invalid = parsed.filter((p) => p.raw !== "" && (Number.isNaN(p.n) || p.n <= 0 || fromDisplayLength(p.n, unit) > 250));
  const filled = parsed.filter((p) => p.raw !== "" && !Number.isNaN(p.n) && p.n > 0);

  const save = () => {
    if (invalid.length) {
      toast.error("Some measurements look off", { description: "Use positive numbers only." });
      return;
    }
    if (!filled.length) {
      toast.error("Enter at least one measurement");
      return;
    }
    const valObj = Object.fromEntries(filled.map((p) => [p.id, Math.round(fromDisplayLength(p.n, unit) * 10) / 10]));
    const existing = measurements.find((m) => m.date === date);
    if (existing) {
      forge.updateMeasurement(existing.id, date, valObj);
      toast.success("Measurements updated");
    } else {
      forge.addMeasurement(date, valObj);
      toast.success("Measurements saved");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log measurements</DialogTitle>
          <DialogDescription>In {unit === "cm" ? "centimetres" : "inches"}. Leave blank to skip.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENTS.map((m) => (
            <div key={m.id} className="space-y-1.5">
              <Label htmlFor={`m-${m.id}`}>{m.label}</Label>
              <div className="relative">
                <Input
                  id={`m-${m.id}`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={values[m.id]}
                  onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value }))}
                  aria-invalid={invalid.some((x) => x.id === m.id)}
                  className="num pr-10"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs text-muted-foreground">{lengthUnitLabel(unit)}</span>
              </div>
            </div>
          ))}
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="m-date">Date</Label>
            <Input id="m-date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value || today)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MeasurementsSection({ today }: { today: string }) {
  const { measurements, settings } = useForge();
  const unit = settings.heightUnit;
  const [open, setOpen] = useState(false);
  const first = measurements[0];
  const last = measurements.at(-1);

  return (
    <section className="surface-card p-5 sm:p-7" aria-labelledby="measure-title">
      <SectionTitle
        title="Measurements"
        description={first && last && first !== last ? `${format(fromDateKey(first.date), "MMM d")} → ${format(fromDateKey(last.date), "MMM d")}` : "Track how your shape changes"}
        action={
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" /> Log
          </Button>
        }
      />
      <h2 id="measure-title" className="sr-only">
        Measurements
      </h2>
      {last ? (
        <>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MEASUREMENTS.map((m) => {
              const end = last.values[m.id];
              const start = [...measurements].find((x) => x.values[m.id] !== undefined)?.values[m.id];
              if (end === undefined) return null;
              const diff = start !== undefined ? end - start : 0;
              return (
                <li key={m.id} className="rounded-2xl bg-surface-2/60 p-4">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="num mt-1 flex items-center gap-1.5 text-sm">
                    {start !== undefined && start !== end && (
                      <>
                        <span className="text-muted-foreground">{formatLength(start, unit)}</span>
                        <ArrowRight className="size-3 text-muted-foreground" aria-label="to" />
                      </>
                    )}
                    <span className="text-base font-semibold">{formatLength(end, unit)}</span>
                  </p>
                  {Math.abs(diff) >= 0.1 && (
                    <p className={cn("num mt-1 text-xs", diff > 0 ? "text-brand-ink" : "text-muted-foreground")}>
                      {diff > 0 ? "+" : "−"}
                      {formatLength(Math.abs(diff), unit)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <details className="group mt-4">
            <summary className="cursor-pointer list-none text-[13px] text-muted-foreground hover:text-foreground">
              <span className="group-open:hidden">Show history ({measurements.length})</span>
              <span className="hidden group-open:inline">Hide history</span>
            </summary>
            <div className="mt-3 overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-surface-2/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    {MEASUREMENTS.map((m) => (
                      <th key={m.id} className="px-3 py-2 text-right font-medium">
                        {m.label}
                      </th>
                    ))}
                    <th className="sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...measurements].reverse().map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 text-muted-foreground">{format(fromDateKey(row.date), "MMM d, yy")}</td>
                      {MEASUREMENTS.map((m) => (
                        <td key={m.id} className="num px-3 py-2 text-right">
                          {row.values[m.id] !== undefined ? toDisplayLength(row.values[m.id]!, unit) : "—"}
                        </td>
                      ))}
                      <td className="px-2 py-1 text-right">
                        <Button variant="ghost" size="icon-xs" aria-label={`Delete measurements from ${row.date}`} onClick={() => forge.removeMeasurement(row.id)}>
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <EmptyState compact icon={Ruler} title="No measurements yet" description="Waist, chest and arms tell you more than the scale alone." action={<Button size="sm" onClick={() => setOpen(true)}>Log measurements</Button>} />
      )}
      {open && <AddMeasurementDialog open={open} onOpenChange={setOpen} today={today} />}
    </section>
  );
}
