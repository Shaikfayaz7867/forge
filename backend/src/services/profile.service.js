import { profileRepository, settingsRepository } from "../repositories/profile.repository.js";
import { ApiError } from "../utils/ApiError.js";

/** Convert DB profile row to frontend-compatible shape. */
function profileToApi(row) {
  if (!row) return null;
  return {
    name: row.name,
    age: row.age,
    gender: row.gender,
    heightCm: Number(row.heightCm),
    weightKg: Number(row.weightKg),
    goal: row.goal,
    activity: row.activity,
    trainingDays: row.trainingDays,
    experience: row.experience,
    calorieOverride: row.calorieOverride,
    createdAt: row.profileCreatedAt.toISOString(),
  };
}

/** Convert DB settings row to frontend-compatible shape. */
function settingsToApi(row) {
  if (!row) return null;
  return {
    weightUnit: row.weightUnit,
    heightUnit: row.heightUnit,
    waterGoalMl: row.waterGoalMl,
    defaultRestSec: row.defaultRestSec,
    notifications: {
      restTimerSound: row.notifRestTimer,
      prCelebrations: row.notifPrCelebrate,
      workoutReminders: row.notifReminders,
    },
    sidebarCollapsed: row.sidebarCollapsed,
    demoMode: row.demoMode,
    theme: row.theme,
  };
}

export const profileService = {
  async get(userId) {
    const profile = await profileRepository.findByUserId(userId);
    return profileToApi(profile);
  },

  async upsert(userId, data) {
    const row = await profileRepository.upsert(userId, {
      name: data.name,
      age: data.age,
      gender: data.gender,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      goal: data.goal,
      activity: data.activity,
      trainingDays: data.trainingDays,
      experience: data.experience,
      calorieOverride: data.calorieOverride,
    });
    return profileToApi(row);
  },

  async patch(userId, data) {
    const existing = await profileRepository.findByUserId(userId);
    if (!existing) throw ApiError.notFound("Profile not found — please complete setup first");
    const merged = { ...existing, ...data };
    return profileService.upsert(userId, profileToApi(merged));
  },
};

export const settingsService = {
  async get(userId) {
    const settings = await settingsRepository.findByUserId(userId);
    return settingsToApi(settings);
  },

  async upsert(userId, data) {
    const dbData = {
      ...(data.weightUnit !== undefined && { weightUnit: data.weightUnit }),
      ...(data.heightUnit !== undefined && { heightUnit: data.heightUnit }),
      ...(data.waterGoalMl !== undefined && { waterGoalMl: data.waterGoalMl }),
      ...(data.defaultRestSec !== undefined && { defaultRestSec: data.defaultRestSec }),
      ...(data.notifications !== undefined && {
        notifRestTimer: data.notifications.restTimerSound,
        notifPrCelebrate: data.notifications.prCelebrations,
        notifReminders: data.notifications.workoutReminders,
      }),
      ...(data.sidebarCollapsed !== undefined && { sidebarCollapsed: data.sidebarCollapsed }),
      ...(data.demoMode !== undefined && { demoMode: data.demoMode }),
      ...(data.theme !== undefined && { theme: data.theme }),
    };
    const row = await settingsRepository.upsert(userId, dbData);
    return settingsToApi(row);
  },
};
