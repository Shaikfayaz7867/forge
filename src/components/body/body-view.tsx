"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useUrlTrigger } from "@/hooks/use-url-trigger";
import { useForge } from "@/store/forge-store";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { useToday } from "@/hooks/use-forge-derived";
import { MeasurementsSection } from "./measurements-section";
import { PhotosSection } from "./photos-section";
import { ProfileCard, TargetsCard } from "./profile-card";
import { LogWeightDialog, WeightSection } from "./weight-section";

export function BodyView() {
  const today = useToday();
  const [logOpen, setLogOpen] = useState(false);
  const [logKey, setLogKey] = useState(0);

  const openLog = () => {
    setLogKey((k) => k + 1);
    setLogOpen(true);
  };

  useUrlTrigger("log", (v) => v === "weight" && openLog());
  const { profile } = useForge();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Body"
        title="How your body is changing"
        description="Weight, measurements and photos — plus the estimates that drive your targets."
        actions={
          <Button size="lg" onClick={openLog}>
            <Plus data-icon="inline-start" /> Log weight
          </Button>
        }
      />
      <WeightSection today={today} onLog={openLog} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <TargetsCard />
        <MeasurementsSection today={today} />
      </div>
      {/* Re-mount when weight is logged elsewhere so the form shows the current value. */}
      <ProfileCard key={profile?.weightKg} />
      <PhotosSection today={today} />
      <LogWeightDialog key={logKey} open={logOpen} onOpenChange={setLogOpen} today={today} />
    </div>
  );
}
