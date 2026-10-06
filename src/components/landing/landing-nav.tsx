"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/logo";
import { NAV_LINKS } from "@/data/landing";
import { cn } from "@/lib/utils";
import { useStartHref } from "./use-start";

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const startHref = useStartHref();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <nav
          aria-label="Primary"
          className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border bg-background/75 py-2 pr-2 pl-4 shadow-(--shadow-soft) backdrop-blur-xl"
        >
          <Link href="/" aria-label="Forge home">
            <Logo />
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors hover:text-foreground sm:inline-flex">
              Log in
            </Link>
            <Link href={startHref} className="hidden h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-transform active:scale-[0.98] sm:inline-flex">
              Start Tracking
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-50 grid size-10 place-items-center rounded-full md:hidden"
            >
              <span className={cn("absolute h-[1.5px] w-5 rounded-full bg-foreground transition-transform duration-300", open ? "rotate-45" : "-translate-y-[4px]")} />
              <span className={cn("absolute h-[1.5px] w-5 rounded-full bg-foreground transition-transform duration-300", open ? "-rotate-45" : "translate-y-[4px]")} />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-30 flex flex-col justify-center bg-background/92 px-8 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ul className="space-y-2">
              {[...NAV_LINKS, { href: startHref, label: "Start Tracking" }].map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-4xl font-semibold tracking-[-0.03em]"
                    initial={{ y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {l.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
