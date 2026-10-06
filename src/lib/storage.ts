import { STORAGE_KEYS } from "@/data/constants";

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

let available: boolean | null = null;

/** True when localStorage can be read and written (false in some private modes). */
export function isStorageAvailable(): boolean {
  if (available !== null) return available;
  try {
    const probe = "__forge_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function readKey<T>(key: StorageKey, fallback: T): T {
  if (typeof window === "undefined" || !isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type WriteResult = { ok: true } | { ok: false; reason: "unavailable" | "quota" | "unknown" };

export function writeKey(key: StorageKey, value: unknown): WriteResult {
  if (typeof window === "undefined") return { ok: false, reason: "unavailable" };
  if (!isStorageAvailable()) return { ok: false, reason: "unavailable" };
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, reason: quota ? "quota" : "unknown" };
  }
}

export function clearAllKeys(): void {
  if (!isStorageAvailable()) return;
  for (const key of Object.values(STORAGE_KEYS)) window.localStorage.removeItem(key);
}

/** Approximate bytes used by Forge keys (UTF-16 ≈ 2 bytes per char). */
export function storageUsageBytes(): number {
  if (typeof window === "undefined" || !isStorageAvailable()) return 0;
  let total = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const v = window.localStorage.getItem(key);
    if (v) total += (v.length + key.length) * 2;
  }
  return total;
}
