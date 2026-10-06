"use client";

import { useRouter } from "next/navigation";
import { forge, useForge } from "@/store/forge-store";

/** Returning users skip onboarding. */
export function useStartHref(): string {
  const { hydrated, profile, isAuthenticated } = useForge();
  return hydrated && isAuthenticated ? "/dashboard" : "/login";
}

/** "Explore Dashboard": open the real dashboard, seeding demo data if there's no profile yet. */
export function useExploreDashboard() {
  const router = useRouter();
  const { isAuthenticated } = useForge();
  return () => {
    router.push(isAuthenticated ? "/dashboard" : "/login");
  };
}
