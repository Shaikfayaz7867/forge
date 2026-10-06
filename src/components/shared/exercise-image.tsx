"use client";

import { useState } from "react";
import type { Exercise, MuscleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Abstract figure highlighting the target region — used when no photo is available. */
function Illustration({ muscle }: { muscle: MuscleGroup }) {
  const hi = "var(--brand)";
  const base = "currentColor";
  const fill = (g: MuscleGroup | MuscleGroup[]) => ((Array.isArray(g) ? g : [g]).includes(muscle) ? hi : base);
  return (
    <svg viewBox="0 0 120 120" className="size-full text-foreground/12" aria-hidden>
      <circle cx="60" cy="20" r="9" fill={base} />
      <rect x="44" y="33" width="32" height="16" rx="7" fill={fill("chest")} />
      <rect x="35" y="33" width="9" height="12" rx="4.5" fill={fill("shoulders")} />
      <rect x="76" y="33" width="9" height="12" rx="4.5" fill={fill("shoulders")} />
      <rect x="31" y="46" width="8" height="28" rx="4" fill={fill("arms")} />
      <rect x="81" y="46" width="8" height="28" rx="4" fill={fill("arms")} />
      <rect x="46" y="50" width="28" height="20" rx="6" fill={fill(["core", "back"])} />
      <rect x="45" y="72" width="13" height="38" rx="6" fill={fill("legs")} />
      <rect x="62" y="72" width="13" height="38" rx="6" fill={fill("legs")} />
    </svg>
  );
}

interface Props {
  exercise: Exercise;
  className?: string;
  /** Use a plain illustration (e.g. in dense lists) and skip the network request. */
  illustrationOnly?: boolean;
}

export function ExerciseImage({ exercise, className, illustrationOnly }: Props) {
  const src = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${exercise.image}/0.jpg`;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showPhoto = !illustrationOnly && src && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-surface-2", className)}>
      {(!showPhoto || !loaded) && (
        <div className="absolute inset-0 grid place-items-center p-3">
          <Illustration muscle={exercise.muscleGroup} />
        </div>
      )}
      {showPhoto && (
        // Remote public-domain images; next/image optimisation isn't needed for these thumbnails.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${exercise.name} demonstration`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500 dark:brightness-[0.85]",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
