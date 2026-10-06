"use client";

import Link from "next/link";
import {
  usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Droplets,
  MoreHorizontal,
  Play,
  Plus,
  Scale,
  Search,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Logo, LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { forge, useForge } from "@/store/forge-store";
import { formatDuration, todayKey } from "@/lib/dates";
import { useNow } from "@/hooks/use-forge-derived";
import { cn } from "@/lib/utils";
import { CommandPalette, openCommandPalette } from "./command-palette";
import { MOBILE_NAV, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";
import { NotificationCenter } from "./notification-center";

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function SidebarLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
        active ? "bg-surface text-foreground shadow-(--shadow-soft)" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          aria-hidden
          className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-brand"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { settings, profile, isAuthenticated } = useForge();
  const collapsed = settings.sidebarCollapsed;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar px-3 py-5 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
      aria-label="Main navigation"
    >
      <div className={cn("flex items-center px-2", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" aria-label="Forge home">
          <Logo collapsed={collapsed} />
        </Link>
      </div>

      <button
        type="button"
        onClick={openCommandPalette}
        className={cn(
          "mt-6 flex h-10 items-center gap-2.5 rounded-xl border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
        aria-label="Search (Ctrl K)"
      >
        <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded-md border bg-surface-2 px-1.5 font-mono text-[10px]">⌘K</kbd>
          </>
        )}
      </button>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none min-h-0">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink key={item.href} item={item} collapsed={collapsed} active={isActive(pathname, item.href)} />
        ))}
        <div className="my-3 h-px bg-border" role="separator" />
        {SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.href} item={item} collapsed={collapsed} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <div className={cn("mt-4 flex items-center gap-2", collapsed ? "flex-col" : "justify-between px-1")}>
        {!collapsed && profile && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile.name}</p>
            <p className="text-xs text-muted-foreground">{settings.demoMode ? "Demo data" : "Local profile"}</p>
          </div>
        )}
        <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
          <NotificationCenter />
          <ThemeToggle />
          <ConfirmDialog
            title="Log out"
            description="Are you sure you want to log out?"
            confirmLabel="Log out"
            destructive
            onConfirm={() => forge.logout()}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Log out" title="Log out">
                <LogOut className="size-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => forge.updateSettings({ sidebarCollapsed: !collapsed })}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function ActiveSessionPill() {
  const { activeSession } = useForge();
  const pathname = usePathname();
  const now = useNow(1000);
  if (!activeSession || pathname.startsWith("/session")) return null;
  const elapsed = Math.max(0, Math.floor((now - Date.parse(activeSession.startedAt)) / 1000));
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 lg:bottom-6"
    >
      <Link
        href="/session"
        className="flex items-center gap-3 rounded-full bg-foreground py-2 pr-2 pl-4 text-background shadow-(--shadow-lift)"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-brand" />
        </span>
        <span className="text-sm font-medium">{activeSession.name}</span>
        <span className="num text-sm opacity-70">{formatDuration(elapsed)}</span>
        <span className="flex h-8 items-center gap-1 rounded-full bg-brand px-3 text-xs font-semibold text-[#1a2a05]">
          <Play className="size-3.5" aria-hidden /> Resume
        </span>
      </Link>
    </motion.div>
  );
}

function QuickActionsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { activeSession } = useForge();
  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };
  const actions = [
    { label: "Log food", description: "Search or type what you ate", icon: Utensils, onClick: () => go("/nutrition?add=1") },
    {
      label: activeSession ? "Resume workout" : "Start workout",
      description: activeSession ? activeSession.name : "Pick a plan or go freestyle",
      icon: Play,
      onClick: () => go(activeSession ? "/session" : "/workouts"),
    },
    { label: "Log weight", description: "Add today's weigh-in", icon: Scale, onClick: () => go("/body?log=weight") },
    {
      label: "Add water",
      description: "+250 ml",
      icon: Droplets,
      onClick: () => {
        forge.addWater(todayKey(), 250);
        toast.success("Added 250 ml of water");
        onOpenChange(false);
      },
    },
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] px-4 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div className="mx-auto h-1 w-10 rounded-full bg-border" aria-hidden />
        <SheetHeader className="px-1 pt-2 pb-0">
          <SheetTitle>Quick add</SheetTitle>
          <SheetDescription>Log something in a couple of taps.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className="flex min-h-24 flex-col items-start justify-between rounded-2xl border bg-surface p-4 text-left transition-transform active:scale-[0.98]"
            >
              <a.icon className="size-5 text-brand-ink" strokeWidth={1.75} aria-hidden />
              <span>
                <span className="block text-sm font-medium">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.description}</span>
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const pathname = usePathname();
  const items = [...PRIMARY_NAV.filter((n) => !MOBILE_NAV.some((m) => m.href === n.href)), ...SECONDARY_NAV];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] px-4 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div className="mx-auto h-1 w-10 rounded-full bg-border" aria-hidden />
        <SheetHeader className="flex-row items-center justify-between px-1 pt-2 pb-0">
          <div>
            <SheetTitle>More</SheetTitle>
            <SheetDescription className="sr-only">All sections</SheetDescription>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConfirmDialog
              title="Log out"
              description="Are you sure you want to log out?"
              confirmLabel="Log out"
              destructive
              onConfirm={() => {
                onOpenChange(false);
                forge.logout();
              }}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Log out" title="Log out">
                  <LogOut className="size-5" />
                </Button>
              }
            />
          </div>
        </SheetHeader>
        <nav className="grid grid-cols-3 gap-2" aria-label="More sections">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => onOpenChange(false)}
              aria-current={isActive(pathname, n.href) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border bg-surface px-2 py-4 text-center text-xs font-medium",
                isActive(pathname, n.href) && "border-brand/60 bg-brand-soft",
              )}
            >
              <n.icon className="size-5" strokeWidth={1.75} aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const [quick, setQuick] = useState(false);
  const [more, setMore] = useState(false);
  const left = MOBILE_NAV.slice(0, 2);
  const right = MOBILE_NAV.slice(2);
  const moreActive = ![...MOBILE_NAV].some((n) => isActive(pathname, n.href));

  const tab = (n: NavItem) => {
    const active = isActive(pathname, n.href);
    return (
      <Link
        key={n.href}
        href={n.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="mobile-tab"
            className="absolute top-0 h-[3px] w-6 rounded-full bg-brand"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
        )}
        <n.icon className="size-[22px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
        {n.label}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-xl safe-bottom lg:hidden"
      >
        <div className="mx-auto flex h-[64px] max-w-lg items-stretch px-2">
          {left.map(tab)}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setQuick(true)}
              aria-label="Quick add"
              className="grid size-12 place-items-center rounded-2xl bg-foreground text-background shadow-(--shadow-lift) transition-transform active:scale-95"
            >
              <Plus className="size-6" strokeWidth={2} />
            </button>
          </div>
          {right.map(tab)}
          <button
            type="button"
            onClick={() => setMore(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              moreActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="size-[22px]" strokeWidth={1.6} aria-hidden />
            More
          </button>
        </div>
      </nav>
      <QuickActionsSheet open={quick} onOpenChange={setQuick} />
      <MoreSheet open={more} onOpenChange={setMore} />
    </>
  );
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl lg:hidden">
      <Link href="/dashboard" aria-label="Forge home" className="flex items-center gap-2">
        <LogoMark className="size-7" />
        <span className="text-[14px] font-semibold tracking-[0.18em]">FORGE</span>
      </Link>
      <div className="flex items-center gap-1">
        <NotificationCenter />
        <Button variant="ghost" size="icon" onClick={openCommandPalette} aria-label="Search">
          <Search className="size-5" strokeWidth={1.75} />
        </Button>
      </div>
    </header>
  );
}

function ShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 px-4 py-8 sm:px-6 lg:px-10" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted/70" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-muted/60" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { hydrated, profile, isAuthenticated } = useForge();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!profile) {
        router.replace("/onboarding");
      }
    }
  }, [hydrated, profile, isAuthenticated, router]);

  const ready = hydrated && !!profile;

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="main" className="flex-1 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-16">
          <AnimatePresence mode="wait" initial={false}>
            {ready ? (
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"
              >
                {children}
              </motion.div>
            ) : (
              <ShellSkeleton key="skeleton" />
            )}
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <ActiveSessionPill />
      <CommandPalette />
    </div>
  );
}
