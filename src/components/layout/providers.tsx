"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_STORAGE_KEY } from "@/data/constants";
import { forge, useForge } from "@/store/forge-store";

function IdleTimer() {
  const { isAuthenticated } = useForge();

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      // Log out after 15 minutes of inactivity (900000 ms)
      timeout = setTimeout(() => {
        forge.logout();
      }, 900000);
    };

    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<"bottom-center" | "bottom-right">("bottom-center");

  useEffect(() => {
    const handleResize = () => {
      setPosition(window.innerWidth < 640 ? "bottom-right" : "bottom-center");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
    >
      <IdleTimer />
      {/* "user" honours prefers-reduced-motion for every motion component. */}
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster position={position} richColors={false} closeButton />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
