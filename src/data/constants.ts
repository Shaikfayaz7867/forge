import type {
  ActivityLevel,
  Experience,
  Goal,
  MealType,
  MeasurementKey,
  Settings,
  TrainingDays,
  WorkoutCategory,
} from "@/lib/types";

export const STORAGE_KEYS = {
  profile: "forge_profile",
  settings: "forge_settings",
  plans: "forge_workouts",
  history: "forge_workout_history",
  activeSession: "forge_active_session",
  foodLogs: "forge_food_logs",
  weights: "forge_weight_history",
  measurements: "forge_measurements",
  water: "forge_water_logs",
  photos: "forge_progress_photos",
} as const;

export const THEME_STORAGE_KEY = "forge_theme";

export const DEFAULT_SETTINGS: Settings = {
  weightUnit: "kg",
  heightUnit: "cm",
  waterGoalMl: 2500,
  defaultRestSec: 90,
  notifications: {
    restTimerSound: true,
    prCelebrations: true,
    workoutReminders: false,
  },
  sidebarCollapsed: false,
  demoMode: false,
};

export const GOALS: { id: Goal; label: string; description: string; calorieDelta: number }[] = [
  { id: "build_muscle", label: "Build Muscle", description: "Lean surplus to support muscle growth", calorieDelta: 250 },
  { id: "gain_weight", label: "Gain Weight", description: "Larger surplus to move the scale up", calorieDelta: 400 },
  { id: "lose_fat", label: "Lose Fat", description: "Moderate deficit while keeping strength", calorieDelta: -400 },
  { id: "maintain", label: "Maintain Weight", description: "Eat at maintenance", calorieDelta: 0 },
  { id: "strength", label: "Improve Strength", description: "Small surplus to fuel heavy training", calorieDelta: 150 },
  { id: "general", label: "General Fitness", description: "Stay active and healthy", calorieDelta: 0 },
];

export const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { id: "sedentary", label: "Sedentary", description: "Desk job, little movement outside training", multiplier: 1.2 },
  { id: "light", label: "Lightly Active", description: "On your feet some of the day", multiplier: 1.375 },
  { id: "moderate", label: "Moderately Active", description: "Regular walking or an active job", multiplier: 1.55 },
  { id: "very", label: "Very Active", description: "Physical job or daily hard training", multiplier: 1.725 },
];

export const EXPERIENCE_LEVELS: { id: Experience; label: string; description: string }[] = [
  { id: "beginner", label: "Beginner", description: "Less than a year of consistent training" },
  { id: "intermediate", label: "Intermediate", description: "1–3 years, comfortable with main lifts" },
  { id: "advanced", label: "Advanced", description: "3+ years of structured training" },
];

export const TRAINING_DAYS: TrainingDays[] = [2, 3, 4, 5, 6];

/** Protein target in g per kg bodyweight, by goal. */
export const PROTEIN_PER_KG: Record<Goal, number> = {
  build_muscle: 1.8,
  gain_weight: 1.6,
  lose_fat: 2.0,
  maintain: 1.6,
  strength: 1.8,
  general: 1.4,
};

/** Share of daily calories from fat, by goal. Carbs fill the remainder. */
export const FAT_SHARE: Record<Goal, number> = {
  build_muscle: 0.25,
  gain_weight: 0.28,
  lose_fat: 0.27,
  maintain: 0.28,
  strength: 0.25,
  general: 0.3,
};

export const WORKOUT_CATEGORIES: { id: WorkoutCategory; label: string }[] = [
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "legs", label: "Legs" },
  { id: "upper", label: "Upper" },
  { id: "lower", label: "Lower" },
  { id: "full", label: "Full Body" },
  { id: "custom", label: "Custom" },
];

export const MEALS: { id: MealType; label: string; defaultTime: string }[] = [
  { id: "breakfast", label: "Breakfast", defaultTime: "08:30" },
  { id: "lunch", label: "Lunch", defaultTime: "13:00" },
  { id: "snack", label: "Snack", defaultTime: "17:00" },
  { id: "dinner", label: "Dinner", defaultTime: "20:30" },
  { id: "other", label: "Other", defaultTime: "22:00" },
];

export const MEASUREMENTS: { id: MeasurementKey; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "waist", label: "Waist" },
  { id: "arms", label: "Arms" },
  { id: "thighs", label: "Thighs" },
  { id: "shoulders", label: "Shoulders" },
  { id: "hips", label: "Hips" },
];

export const REST_PRESETS = [30, 60, 90, 120] as const;
export const WATER_INCREMENTS = [250, 500, 750] as const;

export const RANGE_OPTIONS = [
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "3m", label: "3M", days: 91 },
  { id: "6m", label: "6M", days: 182 },
  { id: "1y", label: "1Y", days: 365 },
  { id: "all", label: "All", days: Infinity },
] as const;

export const muscleGroups: { id: import("@/lib/types").MuscleGroup; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "legs", label: "Legs" },
  { id: "arms", label: "Arms" },
  { id: "core", label: "Core" },
];
export type RangeId = (typeof RANGE_OPTIONS)[number]["id"];

export const NUTRITION_DISCLAIMER =
  "Nutrition values are estimates and can vary by recipe, preparation method and serving size.";
export const ESTIMATE_DISCLAIMER =
  "These are estimates based on standard formulas, not medical advice. Adjust based on how your body responds.";
