import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";

/** Local calendar date key, e.g. 2026-10-02. */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

/** Date key for any ISO timestamp, in local time. */
export function isoToDateKey(iso: string): string {
  return toDateKey(new Date(iso));
}

export function lastNDays(n: number, end: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => toDateKey(subDays(end, n - 1 - i)));
}

export function weekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function currentWeekKeys(date: Date = new Date()): string[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
}

export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(fromDateKey(b), fromDateKey(a));
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatMinutes(totalSec: number): string {
  const min = Math.round(totalSec / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export function nowTime(): string {
  return format(new Date(), "HH:mm");
}
