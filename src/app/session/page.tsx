import type { Metadata } from "next";
import { SessionView } from "@/components/workout/session-view";

export const metadata: Metadata = { title: "Workout" };

export default function SessionPage() {
  return <SessionView />;
}
