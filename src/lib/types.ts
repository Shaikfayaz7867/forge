// Core domain types for Forge. All persisted data conforms to these shapes.

export type Gender = "male" | "female" | "other";
export type Goal =
  | "build_muscle"
  | "gain_weight"
  | "lose_fat"
  | "maintain"
  | "strength"
  | "general";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very";
export type Experience = "beginner" | "intermediate" | "advanced";
export type TrainingDays = 2 | 3 | 4 | 5 | 6;

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activity: ActivityLevel;
  trainingDays: TrainingDays;
  experience: Experience;
  /** Manual daily calorie target; null = use calculated target. */
  calorieOverride: number | null;
  createdAt: string;
}

export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ft";

export interface Settings {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  waterGoalMl: number;
  defaultRestSec: number;
  notifications: {
    restTimerSound: boolean;
    prCelebrations: boolean;
    workoutReminders: boolean;
  };
  sidebarCollapsed: boolean;
  demoMode: boolean;
}

/* ---------------------------------- Exercises --------------------------------- */

export type MuscleGroup = "chest" | "back" | "shoulders" | "legs" | "arms" | "core";
export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "ez-bar";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: Equipment;
  difficulty: Difficulty;
  instructions: string[];
  tips: string[];
  /** Key into `exerciseImages`. */
  image: string;
  /** Bodyweight movements log reps; weight is optional added load. */
  bodyweight?: boolean;
}

/* ---------------------------------- Workouts ---------------------------------- */

export type WorkoutCategory = "push" | "pull" | "legs" | "upper" | "lower" | "full" | "custom";

export interface PlannedExercise {
  id: string;
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  targetWeight: number | null;
  restSec: number;
  notes: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  category: WorkoutCategory;
  exercises: PlannedExercise[];
  notes: string;
  /** Weekdays this plan is scheduled on (0 = Sunday). */
  scheduledDays: number[];
  createdAt: string;
  updatedAt: string;
}

export interface LoggedSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface LoggedExercise {
  id: string;
  exerciseId: string;
  sets: LoggedSet[];
  notes: string;
  restSec: number;
}

export interface WorkoutSession {
  id: string;
  planId: string | null;
  name: string;
  category: WorkoutCategory;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  exercises: LoggedExercise[];
  notes: string;
}

export interface ActiveSession {
  id: string;
  planId: string | null;
  name: string;
  category: WorkoutCategory;
  startedAt: string;
  exercises: LoggedExercise[];
  notes: string;
  currentExerciseIndex: number;
}

/* ---------------------------------- Nutrition --------------------------------- */

export type FoodCategory =
  | "Breakfast"
  | "Rice"
  | "Curries"
  | "Breads"
  | "Snacks"
  | "Dairy"
  | "Protein"
  | "Vegetables"
  | "Fruits"
  | "Nuts & Seeds"
  | "Drinks"
  | "Sweets";

export type MealType = "breakfast" | "lunch" | "snack" | "dinner" | "other";

export interface ServingOption {
  label: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  cuisine: string;
  /** Meals this food is typically eaten at, used for search + suggestions. */
  meals: MealType[];
  /** Alternate spellings / regional names used for search and smart input. */
  aliases?: string[];
  servingOptions: ServingOption[];
}

export interface FoodLogEntry {
  id: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  meal: MealType;
  foodId: string;
  foodName: string;
  servingLabel: string;
  servingGrams: number;
  quantity: number;
  // Totals for this entry (serving × quantity), snapshotted at log time.
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/* ------------------------------------ Body ------------------------------------ */

export interface WeightEntry {
  id: string;
  date: string; // yyyy-MM-dd
  weightKg: number;
}

export type MeasurementKey = "chest" | "waist" | "arms" | "thighs" | "shoulders" | "hips";

export interface MeasurementEntry {
  id: string;
  date: string;
  /** Values stored in centimetres. */
  values: Partial<Record<MeasurementKey, number>>;
}

export type PhotoPose = "front" | "side" | "back";

export interface ProgressPhoto {
  id: string;
  date: string;
  pose: PhotoPose;
  dataUrl: string;
}

/** Water intake per day, keyed by yyyy-MM-dd, value in millilitres. */
export type WaterLogs = Record<string, number>;

/* ------------------------------------ Store ----------------------------------- */

export interface ForgeData {
  profile: Profile | null;
  settings: Settings;
  plans: WorkoutPlan[];
  history: WorkoutSession[];
  activeSession: ActiveSession | null;
  foodLogs: FoodLogEntry[];
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
  water: WaterLogs;
  photos: ProgressPhoto[];
  exercises: Exercise[];
  foods: Food[];
  workoutTemplates: WorkoutTemplate[];
}

export interface ExportFile {
  app: "forge";
  version: 1;
  exportedAt: string;
  data: Omit<ForgeData, "activeSession" | "exercises" | "foods">;
}


export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  targetWeight: number | null;
  restSec: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: WorkoutCategory;
  description: string;
  scheduledDays: number[];
  exercises: TemplateExercise[];
}
