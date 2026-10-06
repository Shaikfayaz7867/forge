"use client";

import { format } from "date-fns";
import { Camera, ImagePlus, Info, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeforeAfterSlider } from "@/components/shared/before-after-slider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionTitle } from "@/components/shared/page-header";
import { Segmented } from "@/components/shared/segmented";
import { fromDateKey } from "@/lib/dates";
import { storageUsageBytes } from "@/lib/storage";
import type { PhotoPose, ProgressPhoto } from "@/lib/types";
import { forge, useForge } from "@/store/forge-store";

const POSES: { id: PhotoPose; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
];

/** Downscale to keep each photo around 50–120 KB so localStorage doesn't fill up. */
async function compressImage(file: File, maxSide = 720, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Couldn't read that image"));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const STORAGE_BUDGET = 5 * 1024 * 1024;

export function PhotosSection({ today }: { today: string }) {
  const { photos } = useForge();
  const [pose, setPose] = useState<PhotoPose>("front");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<ProgressPhoto | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const posePhotos = useMemo(() => photos.filter((p) => p.pose === pose).sort((a, b) => a.date.localeCompare(b.date)), [photos, pose]);
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const before = posePhotos.find((p) => p.id === beforeId) ?? posePhotos[0];
  const after = posePhotos.find((p) => p.id === afterId) ?? posePhotos.at(-1);
  // Usage is read on render; photos changing re-renders this component.
  const usage = photos.length ? storageUsageBytes() : 0;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      const res = await forge.addPhoto({ date: today, pose, dataUrl });
      if (res.ok) toast.success(`${POSES.find((p) => p.id === pose)?.label} photo saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't process that image");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const byDate = useMemo(() => {
    const m = new Map<string, ProgressPhoto[]>();
    for (const p of [...photos].sort((a, b) => b.date.localeCompare(a.date))) m.set(p.date, [...(m.get(p.date) ?? []), p]);
    return [...m.entries()];
  }, [photos]);

  return (
    <section className="surface-card p-5 sm:p-7" aria-labelledby="photos-title">
      <SectionTitle
        title="Progress photos"
        description="Optional · stored only in this browser"
        action={
          <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={busy}>
            <ImagePlus data-icon="inline-start" /> {busy ? "Saving…" : "Add photo"}
          </Button>
        }
      />
      <h2 id="photos-title" className="sr-only">
        Progress photos
      </h2>
      <input ref={input} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Upload progress photo" />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Pose" value={pose} onChange={setPose} options={POSES} />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" aria-hidden />
          Photos are compressed. Browser storage is limited (~5 MB) — export regularly.
          {usage > 0 && <span className="num">({Math.round((usage / STORAGE_BUDGET) * 100)}% used)</span>}
        </p>
      </div>

      {posePhotos.length >= 2 && before && after ? (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-medium">Compare Progress</h3>
          <BeforeAfterSlider
            className="mx-auto aspect-[3/4] w-full max-w-sm rounded-2xl bg-surface-2"
            beforeLabel={format(fromDateKey(before.date), "MMM d")}
            afterLabel={format(fromDateKey(after.date), "MMM d")}
            // eslint-disable-next-line @next/next/no-img-element
            before={<img src={before.dataUrl} alt={`${pose} photo from ${before.date}`} className="size-full object-cover" draggable={false} />}
            // eslint-disable-next-line @next/next/no-img-element
            after={<img src={after.dataUrl} alt={`${pose} photo from ${after.date}`} className="size-full object-cover" draggable={false} />}
          />
          <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
            {[
              { label: "Before", value: before.id, set: setBeforeId },
              { label: "After", value: after.id, set: setAfterId },
            ].map((s) => (
              <Select key={s.label} value={s.value} onValueChange={s.set}>
                <SelectTrigger className="w-full" aria-label={`${s.label} photo`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {posePhotos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {s.label}: {format(fromDateKey(p.date), "MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        </div>
      ) : (
        posePhotos.length === 1 && <p className="mt-5 text-sm text-muted-foreground">Add another {pose} photo later to compare side by side.</p>
      )}

      {photos.length ? (
        <div className="mt-6 space-y-5">
          {byDate.map(([date, list]) => (
            <div key={date}>
              <p className="mb-2 text-xs text-muted-foreground">{format(fromDateKey(date), "EEEE, MMM d yyyy")}</p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {list.map((p) => (
                  <li key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.dataUrl} alt={`${p.pose} progress photo`} loading="lazy" className="size-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium capitalize">{p.pose}</span>
                    <button
                      type="button"
                      onClick={() => setToDelete(p)}
                      aria-label={`Delete ${p.pose} photo from ${p.date}`}
                      className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-background/85 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState compact icon={Camera} title="No photos yet" description="Front, side and back photos every few weeks make change easier to see." />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this photo?"
        description="It will be permanently removed from this browser."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (toDelete) forge.removePhoto(toDelete.id);
          setToDelete(null);
        }}
      />
    </section>
  );
}
