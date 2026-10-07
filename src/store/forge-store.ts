"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS } from "@/data/constants";
import { uid } from "@/lib/ids";
import { detectSessionPRs, previousPerformance, type PREvent } from "@/lib/workout-stats";
import { forgeApi } from "@/lib/api-client";
import type {
  ActiveSession,
  ExportFile,
  FoodLogEntry,
  ForgeData,
  MeasurementEntry,
  Profile,
  ProgressPhoto,
  Settings,
  WeightEntry,
  WorkoutPlan,
  WorkoutSession,
} from "@/lib/types";

export interface ForgeState extends ForgeData {
  hydrated: boolean;
  storageAvailable: boolean;
  backendConnected: boolean;
  isAuthenticated: boolean;
}

const emptyData = (): ForgeData => ({
  profile: null,
  settings: DEFAULT_SETTINGS,
  plans: [],
  history: [],
  activeSession: null,
  foodLogs: [],
  weights: [],
  measurements: [],
  water: {},
  photos: [],
  exercises: [],
  foods: [],
  workoutTemplates: [],
});

export const exerciseById = (state: ForgeState) => Object.fromEntries(state.exercises.map(e => [e.id, e]));
export const foodById = (state: ForgeState) => Object.fromEntries(state.foods.map(f => [f.id, f]));

const SERVER_STATE: ForgeState = {
  ...emptyData(),
  hydrated: false,
  storageAvailable: true,
  backendConnected: true,
  isAuthenticated: false,
};

let state: ForgeState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

let authPromise: Promise<boolean> | null = null;
let isAuthVerified = false;

/** Ensure user is authenticated with backend via JWT cookies/session. */
async function ensureAuthenticated(): Promise<boolean> {
  if (isAuthVerified) return true;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      const me = await forgeApi.getMe();
      if (me.success) {
        isAuthVerified = true;
        return true;
      }
    } catch (err) {
      // User is unauthenticated
    }
    return false;
  })().finally(() => {
    authPromise = null;
  });

  return authPromise;
}

let loadPromise: Promise<void> | null = null;

/** Loads state from Express PostgreSQL API backend. */
async function loadFromBackend() {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const authOk = await ensureAuthenticated();
    if (!authOk) {
      state = { ...state, hydrated: true, backendConnected: false };
      emit();
      return;
    }

    try {
      const [
        profileRes,
        settingsRes,
        plansRes,
        historyRes,
        activeRes,
        foodRes,
        exercisesRes,
        foodsRes,
        templatesRes,
        weightRes,
        measureRes,
        waterRes,
        photoRes,
      ] = await Promise.all([
        forgeApi.getProfile().catch(() => null),
        forgeApi.getSettings().catch(() => null),
        forgeApi.getPlans().catch(() => null),
        forgeApi.getHistory().catch(() => null),
        forgeApi.getActiveSession().catch(() => null),
        forgeApi.getNutritionLogs().catch(() => null),
        forgeApi.getExercises().catch(() => null),
        forgeApi.getFoods().catch(() => null),
        forgeApi.getWorkoutTemplates().catch(() => null),
        forgeApi.getWeight().catch(() => null),
        forgeApi.getMeasurements().catch(() => null),
        forgeApi.getWater().catch(() => null),
        forgeApi.getProgressPhotos().catch(() => null),
      ]);

      const waterRecord: Record<string, number> = {};
      const waterItems = waterRes?.success && Array.isArray(waterRes.data?.items)
        ? waterRes.data.items
        : (waterRes?.success && Array.isArray(waterRes.data) ? waterRes.data : []);
      for (const w of waterItems) {
        if (w && w.date) waterRecord[w.date] = Number(w.amountMl) || 0;
      }

      const weightItems = weightRes?.success && Array.isArray(weightRes.data?.items)
        ? weightRes.data.items
        : (weightRes?.success && Array.isArray(weightRes.data) ? weightRes.data : []);
      const weights: WeightEntry[] = weightItems.map((w: any) => ({
        ...w,
        weightKg: Number(w.weightKg) || 0,
      }));

      const measureItems = measureRes?.success && Array.isArray(measureRes.data?.items)
        ? measureRes.data.items
        : (measureRes?.success && Array.isArray(measureRes.data) ? measureRes.data : []);
      const measurements: MeasurementEntry[] = measureItems.map((m: any) => {
        const values: Record<string, number> = {};
        if (m.values && typeof m.values === "object") {
          for (const [k, v] of Object.entries(m.values)) {
            values[k] = Number(v) || 0;
          }
        }
        return { ...m, values };
      });

      const photoItems = photoRes?.success && Array.isArray(photoRes.data?.items)
        ? photoRes.data.items
        : (photoRes?.success && Array.isArray(photoRes.data) ? photoRes.data : []);

      state = {
        profile: profileRes?.success ? profileRes.data : state.profile,
        settings: settingsRes?.success ? { ...DEFAULT_SETTINGS, ...settingsRes.data } : state.settings,
        plans: plansRes?.success ? plansRes.data : [],
        history: historyRes?.success && Array.isArray(historyRes.data?.items) ? historyRes.data.items : (historyRes?.success && Array.isArray(historyRes.data) ? historyRes.data : []),
        activeSession: activeRes?.success ? activeRes.data : null,
        foodLogs: foodRes?.success && Array.isArray(foodRes.data) ? foodRes.data : [],
        weights,
        measurements,
        water: waterRecord,
        photos: photoItems,
        exercises: exercisesRes?.success && Array.isArray(exercisesRes.data?.items) ? exercisesRes.data.items : (exercisesRes?.success && Array.isArray(exercisesRes.data) ? exercisesRes.data : []),
        foods: foodsRes?.success && Array.isArray(foodsRes.data?.items) ? foodsRes.data.items : (foodsRes?.success && Array.isArray(foodsRes.data) ? foodsRes.data : []),
        workoutTemplates: typeof templatesRes !== "undefined" && templatesRes?.success ? (Array.isArray(templatesRes.data?.items) ? templatesRes.data.items : templatesRes.data) : [],
        hydrated: true,
        storageAvailable: true,
        backendConnected: true,
        isAuthenticated: profileRes && profileRes.error?.code === "UNAUTHORIZED" ? false : true,
      };
    } catch (err) {
      console.error("Failed to load data from backend", err);
      state = { ...state, hydrated: true, backendConnected: false };
    }

    emit();
  })().finally(() => {
    loadPromise = null;
  });

  return loadPromise;
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  loadFromBackend();
}

function updateState(patch: Partial<ForgeData>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

const getServerSnapshot = () => SERVER_STATE;

export function useForge(): ForgeState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const getForgeState = getSnapshot;
const nowIso = () => new Date().toISOString();

/* ---------------------------------- Actions ---------------------------------- */

export const forge = {

  reload() {
    return loadFromBackend();
  },
  /* Profile & settings */
  async saveProfile(profile: Profile) {
    updateState({ profile });
    try {
      await forgeApi.updateProfile(profile as unknown as Record<string, unknown>);
    } catch {
      toast.error("Failed to sync profile with server");
    }
  },
  async updateProfile(patch: Partial<Profile>) {
    if (!state.profile) return;
    const nextProfile = { ...state.profile, ...patch };
    updateState({ profile: nextProfile });
    try {
      await forgeApi.updateProfile(patch as Record<string, unknown>);
    } catch {
      toast.error("Failed to sync profile with server");
    }
  },
  async updateSettings(patch: Partial<Settings>) {
    const nextSettings = { ...state.settings, ...patch };
    updateState({ settings: nextSettings });
    try {
      await forgeApi.updateSettings(nextSettings as Record<string, unknown>);
    } catch {
      toast.error("Failed to sync settings with server");
    }
  },

  /* Plans */
  async createPlan(plan: Omit<WorkoutPlan, "id" | "createdAt" | "updatedAt">): Promise<WorkoutPlan> {
    const full: WorkoutPlan = { ...plan, id: uid("plan"), createdAt: nowIso(), updatedAt: nowIso() };
    updateState({ plans: [...state.plans, full] });
    try {
      const res = await forgeApi.createPlan(plan as unknown as Record<string, unknown>);
      if (res.success && res.data) {
        updateState({
          plans: state.plans.map((p) => (p.id === full.id ? res.data : p)),
        });
        return res.data;
      }
    } catch {
      toast.error("Failed to create plan on server");
    }
    return full;
  },
  async updatePlan(id: string, patch: Partial<WorkoutPlan>) {
    updateState({
      plans: state.plans.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p)),
    });
    try {
      await forgeApi.updatePlan(id, patch as Record<string, unknown>);
    } catch {
      toast.error("Failed to update plan on server");
    }
  },
  async deletePlan(id: string) {
    updateState({ plans: state.plans.filter((p) => p.id !== id) });
    try {
      await forgeApi.deletePlan(id);
    } catch {
      toast.error("Failed to delete plan on server");
    }
  },
  async duplicatePlan(id: string): Promise<WorkoutPlan | null> {
    const src = state.plans.find((p) => p.id === id);
    if (!src) return null;
    return forge.createPlan({
      ...src,
      name: `${src.name} (copy)`,
      exercises: src.exercises.map((e) => ({ ...e, id: uid("pe") })),
    });
  },

  /* Workout session */
  async startSession(plan: WorkoutPlan | null, name = "Quick Workout"): Promise<ActiveSession> {
    const session: ActiveSession = {
      id: uid("ses"),
      planId: plan?.id ?? null,
      name: plan?.name ?? name,
      category: plan?.category ?? "custom",
      startedAt: nowIso(),
      notes: "",
      currentExerciseIndex: 0,
      exercises: (plan?.exercises ?? []).map((pe) => {
        const prev = previousPerformance(state.history, pe.exerciseId);
        const prevTop = prev ? Math.max(...prev.sets.map((s) => s.weight)) : null;
        return {
          id: uid("le"),
          exerciseId: pe.exerciseId,
          notes: pe.notes,
          restSec: pe.restSec,
          sets: Array.from({ length: pe.sets }, (_, i) => ({
            id: uid("set"),
            weight: prev?.sets[i]?.weight ?? prevTop ?? pe.targetWeight ?? 0,
            reps: pe.repMax,
            completed: false,
          })),
        };
      }),
    };
    updateState({ activeSession: session });
    try {
      await forgeApi.startSession({
        planId: session.planId,
        name: session.name,
        category: session.category,
      });
    } catch {
      // Background sync warning
    }
    return session;
  },
  async updateSession(updater: (s: ActiveSession) => ActiveSession) {
    if (!state.activeSession) return;
    const nextSession = updater(state.activeSession);
    updateState({ activeSession: nextSession });
    try {
      await forgeApi.updateActiveSession(nextSession as unknown as Record<string, unknown>);
    } catch {
      // Ignored
    }
  },
  async cancelSession() {
    updateState({ activeSession: null });
    try {
      await forgeApi.cancelActiveSession();
    } catch {
      // Ignored
    }
  },
  async finishSession(): Promise<{ session: WorkoutSession; prs: PREvent[] } | null> {
    const active = state.activeSession;
    if (!active) return null;
    const exercises = active.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.completed) }))
      .filter((e) => e.sets.length > 0);
    if (exercises.length === 0) return null;
    const endedAt = nowIso();
    const session: WorkoutSession = {
      id: active.id,
      planId: active.planId,
      name: active.name,
      category: active.category,
      startedAt: active.startedAt,
      endedAt,
      durationSec: Math.max(60, Math.round((Date.parse(endedAt) - Date.parse(active.startedAt)) / 1000)),
      exercises,
      notes: active.notes,
    };
    const prs = detectSessionPRs(state.history, session);
    updateState({ history: [...state.history, session], activeSession: null });
    try {
      await forgeApi.finishSession();
    } catch {
      toast.error("Failed to complete session on server");
    }
    return { session, prs };
  },
  async deleteSession(id: string) {
    updateState({ history: state.history.filter((s) => s.id !== id) });
    try {
      await forgeApi.deleteSession(id);
    } catch {
      toast.error("Failed to delete session on server");
    }
  },

  /* Food */
  async getRescueOptions(params: { craving: string; remainingCalories: number; remainingProtein?: number; remainingCarbs?: number; remainingFat?: number }) {
    try {
      const res = await forgeApi.getRescueOptions(params);
      if (res.success && res.data) return res.data;
    } catch {
      // Fall back to client calculation if backend API unavailable
    }
    // Client-side fallback computation from state.foods
    const craving = params.craving || "sweet";
    const targetCals = Math.max(80, Math.min(params.remainingCalories || 300, 800));
    const foods = state.foods || [];
    const candidates: any[] = [];
    const categoriesMap: Record<string, string[]> = {
      sweet: ["Sweets", "Fruits", "Drinks", "Dairy"],
      salty: ["Snacks", "Nuts_and_Seeds"],
      savory: ["Curries", "Breads", "Breakfast", "Protein"],
      creamy: ["Dairy", "Sweets"],
      refreshing: ["Drinks", "Fruits"],
      high_protein: ["Protein", "Dairy"],
    };
    const titlesMap: Record<string, string> = {
      sweet: "Sweet & Chocolatey",
      salty: "Salty & Crunchy",
      savory: "Savory & Comfort",
      creamy: "Cold & Creamy",
      refreshing: "Refreshing & Hydrating",
      high_protein: "High Protein Emergency",
    };
    const targetCategories = categoriesMap[craving] || categoriesMap.sweet;

    for (const food of foods) {
      if (!targetCategories.includes(food.category) && !food.name.toLowerCase().includes(craving)) continue;
      for (const option of food.servingOptions || []) {
        for (const mult of [1.0, 0.75, 0.5]) {
          const scaledCals = Math.round(Number(option.calories) * mult);
          if (scaledCals < 30 || scaledCals > targetCals + 50) continue;
          candidates.push({
            id: `${food.id}_${option.id}_${mult}`,
            foodId: food.id,
            foodName: food.name,
            category: food.category,
            servingLabel: mult === 1 ? option.label : `${mult}x ${option.label}`,
            servingGrams: Math.round(Number(option.grams) * mult),
            quantity: mult,
            calories: scaledCals,
            protein: Math.round(Number(option.protein) * mult * 10) / 10,
            carbs: Math.round(Number(option.carbs) * mult * 10) / 10,
            fat: Math.round(Number(option.fat) * mult * 10) / 10,
            reason: `Only ${scaledCals} kcal • Fits your target!`,
            encouragement: "Zero guilt! Satisfies your craving while keeping your streak 100% active.",
          });
        }
      }
    }
    candidates.sort((a, b) => b.calories - a.calories);
    const unique = new Map();
    for (const c of candidates) {
      if (!unique.has(c.foodId)) unique.set(c.foodId, c);
      if (unique.size >= 4) break;
    }
    return {
      craving,
      cravingTitle: titlesMap[craving] || "Rescue Treat",
      targetCalories: targetCals,
      options: Array.from(unique.values()),
    };
  },

  async addFoodEntries(entries: FoodLogEntry[]) {
    updateState({ foodLogs: [...state.foodLogs, ...entries] });
    try {
      await forgeApi.addFoodEntries(entries);
    } catch {
      toast.error("Failed to save food log to server");
    }
  },
  async updateFoodEntry(id: string, patch: Partial<FoodLogEntry>) {
    updateState({ foodLogs: state.foodLogs.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
    try {
      await forgeApi.updateFoodEntry(id, patch as Record<string, unknown>);
    } catch {
      toast.error("Failed to update food log");
    }
  },
  async removeFoodEntry(id: string): Promise<FoodLogEntry | undefined> {
    const removed = state.foodLogs.find((f) => f.id === id);
    updateState({ foodLogs: state.foodLogs.filter((f) => f.id !== id) });
    try {
      await forgeApi.removeFoodEntry(id);
    } catch {
      toast.error("Failed to delete food entry");
    }
    return removed;
  },

  /* Water */
  async addWater(date: string, ml: number) {
    const next = Math.max(0, Math.min(10000, (state.water[date] ?? 0) + ml));
    updateState({ water: { ...state.water, [date]: next } });
    try {
      await forgeApi.addWater(date, ml);
    } catch {
      toast.error("Failed to update water intake");
    }
  },

  /* Body */
  async addWeight(date: string, weightKg: number) {
    const others = state.weights.filter((w) => w.date !== date);
    const weights: WeightEntry[] = [...others, { id: uid("w"), date, weightKg }].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const patch: Partial<ForgeData> = { weights };
    if (state.profile && weights.at(-1)?.date === date) patch.profile = { ...state.profile, weightKg };
    updateState(patch);
    try {
      await forgeApi.addWeight(date, weightKg);
    } catch {
      toast.error("Failed to save weight entry");
    }
  },
  async removeWeight(id: string) {
    updateState({ weights: state.weights.filter((w) => w.id !== id) });
    try {
      await forgeApi.deleteWeight(id);
    } catch {
      toast.error("Failed to delete weight entry");
    }
  },
  async updateWeight(id: string, date: string, weightKg: number) {
    const updated = state.weights.map((w) => (w.id === id ? { ...w, date, weightKg } : w)).sort((a, b) => a.date.localeCompare(b.date));
    updateState({ weights: updated });
    try {
      await forgeApi.updateWeight(id, date, weightKg);
    } catch {
      toast.error("Failed to update weight entry");
    }
  },
  async addMeasurement(date: string, values: MeasurementEntry["values"]) {
    const others = state.measurements.filter((m) => m.date !== date);
    updateState({
      measurements: [...others, { id: uid("m"), date, values }].sort((a, b) => a.date.localeCompare(b.date)),
    });
    try {
      await forgeApi.addMeasurement(date, values as Record<string, number>);
    } catch {
      toast.error("Failed to save body measurement");
    }
  },
  async updateMeasurement(id: string, date: string, values: MeasurementEntry["values"]) {
    const updated = state.measurements.map((m) => (m.id === id ? { ...m, date, values } : m)).sort((a, b) => a.date.localeCompare(b.date));
    updateState({ measurements: updated });
    try {
      await forgeApi.updateMeasurement(id, date, values as Record<string, number>);
    } catch {
      toast.error("Failed to update measurement");
    }
  },
  async removeMeasurement(id: string) {
    updateState({ measurements: state.measurements.filter((m) => m.id !== id) });
    try {
      await forgeApi.deleteMeasurement(id);
    } catch {
      toast.error("Failed to delete measurement");
    }
  },
  async addPhoto(photo: Omit<ProgressPhoto, "id">) {
    const fullPhoto = { ...photo, id: uid("ph") };
    updateState({ photos: [...state.photos, fullPhoto] });
    return { ok: true as const };
  },
  async removePhoto(id: string) {
    updateState({ photos: state.photos.filter((p) => p.id !== id) });
    try {
      await forgeApi.deletePhoto(id);
    } catch {
      toast.error("Failed to delete photo");
    }
  },

  /* Data management */
  exportData(): ExportFile {
    const { profile, settings, plans, history, foodLogs, weights, measurements, water, photos, workoutTemplates } = state;
    return {
      app: "forge",
      version: 1,
      exportedAt: nowIso(),
      data: { profile, settings, plans, history, foodLogs, weights, measurements, water, photos, workoutTemplates },
    };
  },
  async importData(raw: string): Promise<{ ok: true } | { ok: false; error: string }> {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return { ok: false, error: "This file isn't valid JSON." };
    }
    try {
      const res = await forgeApi.importData(json as Record<string, unknown>);
      if (res.success) {
        await loadFromBackend();
        return { ok: true };
      }
      return { ok: false, error: res.error?.message || "Import failed" };
    } catch (err: unknown) {
      return { ok: false, error: (err as Error).message || "Import failed" };
    }
  },
  resetAll() {
    state = { ...emptyData(), hydrated: true, storageAvailable: true, backendConnected: true, isAuthenticated: false };
    emit();
  },
  startFresh() {
    updateState({ ...emptyData(), settings: { ...state.settings, demoMode: false } });
  },
  async logout() {
    isAuthVerified = false;
    try {
      await forgeApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    this.resetAll();
    window.location.href = "/login";
  },
};
