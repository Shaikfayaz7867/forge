"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Sparkles, Trophy, Zap, Flame, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { forgeApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await forgeApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch {
      // API call silent fail fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyQuote = async () => {
    try {
      setLoadingQuote(true);
      const res = await forgeApi.getDailyQuote();
      if (res.success && res.data) {
        setQuote(res.data);
      }
    } catch {
      // Fallback local quote
      setQuote({
        quote: "The body achieves what the mind believes.",
        author: "Napoleon Hill",
      });
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchDailyQuote();

    // Setup SSE live stream listener
    let eventSource: EventSource | null = null;
    try {
      const streamUrl = forgeApi.getNotificationsStreamUrl();
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.addEventListener("notification", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const newNotif: NotificationItem = {
            id: payload.id || `sse-${Date.now()}`,
            type: payload.type || "INFO",
            title: payload.title || "Notification",
            message: payload.message || "",
            read: false,
            createdAt: new Date().toISOString(),
          };

          setNotifications((prev) => [newNotif, ...prev]);

          // Toast highlight
          toast(newNotif.title, {
            description: newNotif.message,
            icon: <Sparkles className="size-4 text-brand" />,
          });
        } catch (err) {
          console.error("SSE parse error", err);
        }
      });

      eventSource.onerror = () => {
        // SSE network failure, eventSource reconnects automatically
      };
    } catch (err) {
      console.warn("SSE connection error", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await forgeApi.markNotificationRead(id);
    } catch {
      // Fail silent
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await forgeApi.markAllNotificationsRead();
    } catch {
      // Fail silent
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PR":
        return <Trophy className="size-4 text-amber-500" />;
      case "STREAK":
        return <Flame className="size-4 text-orange-500" />;
      case "MOTIVATION":
        return <Sparkles className="size-4 text-purple-500" />;
      default:
        return <Zap className="size-4 text-brand" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
          title="Notifications & Daily Motivation"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[360px] p-0 shadow-2xl border bg-surface rounded-2xl overflow-hidden">
        {/* Daily Motivation Banner */}
        <div className="bg-gradient-to-br from-brand/10 via-surface-2 to-surface p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand tracking-wide uppercase">
              <Sparkles className="size-3.5" />
              Daily Motivation
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={fetchDailyQuote}
              disabled={loadingQuote}
              className="size-6 text-muted-foreground hover:text-foreground"
              title="New Quote"
            >
              <RefreshCw className={cn("size-3", loadingQuote && "animate-spin")} />
            </Button>
          </div>
          {quote ? (
            <div>
              <p className="text-xs italic text-foreground/90 font-medium">"{quote.quote}"</p>
              <p className="text-[11px] text-muted-foreground mt-1 text-right">— {quote.author}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Loading inspiration...</p>
          )}
        </div>

        {/* Notifications Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-surface-2/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Updates</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleMarkAllRead}
              className="text-[11px] text-muted-foreground hover:text-foreground h-7 px-2"
            >
              <Check className="size-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[300px] overflow-y-auto divide-y">
          {loading && notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading activity...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recent notifications yet. Log your workouts to see updates here!
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.read && handleMarkRead(item.id)}
                className={cn(
                  "flex items-start gap-3 p-3.5 text-xs transition-colors cursor-pointer",
                  !item.read ? "bg-brand/5 hover:bg-brand/10" : "hover:bg-surface-2/50",
                )}
              >
                <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-surface-2">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn("truncate font-medium", !item.read && "font-semibold text-foreground")}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 mt-0.5">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
