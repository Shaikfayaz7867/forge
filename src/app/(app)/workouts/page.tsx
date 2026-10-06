import type { Metadata } from "next";
import { WorkoutsView } from "@/components/workout/workouts-view";

export const metadata: Metadata = { title: "Workouts" };

export default function WorkoutsPage() {
  return <WorkoutsView />;
}
