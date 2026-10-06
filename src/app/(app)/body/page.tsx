import type { Metadata } from "next";
import { Suspense } from "react";
import { BodyView } from "@/components/body/body-view";

export const metadata: Metadata = { title: "Body" };

export default function BodyPage() {
  return (
    <Suspense>
      <BodyView />
    </Suspense>
  );
}
