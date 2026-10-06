import type { Metadata } from "next";
import { Suspense } from "react";
import { ExerciseLibrary } from "@/components/workout/exercise-library";

export const metadata: Metadata = { title: "Exercises" };

export default function ExercisesPage() {
  return (
    <Suspense>
      <ExerciseLibrary />
    </Suspense>
  );
}
