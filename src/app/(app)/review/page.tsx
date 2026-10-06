import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewView } from "@/components/progress/review-view";

export const metadata: Metadata = { title: "Weekly Review" };

export default function Page() {
  return (
    <Suspense>
      <ReviewView />
    </Suspense>
  );
}
