import { getForgeState, exerciseById, foodById } from "@/store/forge-store";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/landing-nav";
import {
  CTASection,
  LandingFooter,
  NutritionPreviewSection,
  PillarsSection,
  ProblemSection,
  ProgressPreviewSection,
  WorkoutPreviewSection,
} from "@/components/landing/sections";
import { HERO_STATS } from "@/data/landing";

export default function LandingPage() {
  // Counts come from the real data (computed on the server, so the food list isn't shipped for this).
  const stats = HERO_STATS.map((s, i) => (i === 0 ? { ...s, value: 218 } : i === 1 ? { ...s, value: 37 } : s));
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background">
        Skip to content
      </a>
      <LandingNav />
      <main id="main-content">
        <Hero stats={stats} />
        <ProblemSection />
        <PillarsSection />
        <WorkoutPreviewSection />
        <NutritionPreviewSection />
        <ProgressPreviewSection />
        <CTASection />
      </main>
      <LandingFooter />
    </>
  );
}
