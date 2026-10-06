import type { Metadata } from "next";
import { Suspense } from "react";
import { PlansView } from "@/components/workout/plans-view";

export const metadata: Metadata = { title: "Plans" };

export default function PlansPage() {
  return (
    <Suspense>
      <PlansView />
    </Suspense>
  );
}
