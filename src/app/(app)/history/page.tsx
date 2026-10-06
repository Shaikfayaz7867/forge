import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryView } from "@/components/progress/history-view";

export const metadata: Metadata = { title: "History" };

export default function Page() {
  return (
    <Suspense>
      <HistoryView />
    </Suspense>
  );
}
