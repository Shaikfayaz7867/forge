// Static marketing content for the landing page. Kept out of components so copy edits are trivial.

export const NAV_LINKS = [
  { href: "#workouts", label: "Workouts" },
  { href: "#nutrition", label: "Nutrition" },
  { href: "#rescue", label: "Rescue" },
  { href: "#progress", label: "Progress" },
];

export const HERO_STATS = [
  { value: 218, suffix: "", label: "Indian & South Indian foods" },
  { value: 37, suffix: "", label: "Exercises with form guides" },
  { value: 0, suffix: "", label: "Accounts or sign-ups" },
  { value: 100, suffix: "%", label: "Stored on your device" },
];

export const PILLARS = [
  {
    id: "workouts",
    eyebrow: "01 · Workout tracking",
    title: "Every set, logged in seconds.",
    body: "Plan push, pull and leg days, then log weight and reps with your last session right beside you. Rest timer included.",
  },
  {
    id: "nutrition",
    eyebrow: "02 · Nutrition tracking",
    title: "Idli to biryani, counted.",
    body: "A food database built around how India actually eats. Type “2 idli, 1 cup sambar” and it's logged.",
  },
  {
    id: "progress",
    eyebrow: "03 · Progress analytics",
    title: "Proof you're getting stronger.",
    body: "Estimated 1RM, volume, PRs, weight trend and muscle balance — calculated from what you actually did.",
  },
];

export const PREVIEW_WORKOUT = {
  name: "Push Day",
  exercises: [
    { id: "bench-press", name: "Bench Press", previous: "40 × 10", sets: [{ w: 42.5, r: 10 }, { w: 42.5, r: 9 }, { w: 42.5, r: 8 }] },
    { id: "squat", name: "Squat", previous: "60 × 8", sets: [{ w: 62.5, r: 8 }, { w: 62.5, r: 8 }, { w: 62.5, r: 7 }] },
    { id: "lat-pulldown", name: "Lat Pulldown", previous: "40 × 10", sets: [{ w: 42.5, r: 10 }, { w: 42.5, r: 10 }, { w: 42.5, r: 9 }] },
  ],
};

export const PREVIEW_FOODS = [
  "Idli", "Plain Dosa", "Masala Dosa", "Medu Vada", "Sambar", "Rasam", "Steamed Rice", "Curd Rice",
  "Lemon Rice", "Tamarind Rice", "Upma", "Ven Pongal", "Chicken Biryani", "Chicken 65", "Boiled Egg",
  "Paneer", "Pesarattu", "Appam", "Filter Coffee", "Buttermilk", "Chapati", "Fish Curry",
];

export const PREVIEW_MEALS = [
  { meal: "Breakfast", time: "08:30", items: [{ name: "Idli", qty: "3 pieces", kcal: 174, protein: 6 }, { name: "Boiled egg", qty: "2 eggs", kcal: 150, protein: 13 }, { name: "Banana", qty: "1 medium", kcal: 105, protein: 1 }] },
  { meal: "Lunch", time: "12:45", items: [{ name: "Sambar rice", qty: "1 plate", kcal: 420, protein: 12 }, { name: "Chicken 65", qty: "1 serving", kcal: 300, protein: 24 }] },
];

export const PREVIEW_WEIGHT = [
  { date: "2026-08-01", value: 54.6 }, { date: "2026-08-08", value: 54.9 }, { date: "2026-08-15", value: 55.0 },
  { date: "2026-08-22", value: 55.4 }, { date: "2026-08-29", value: 55.2 }, { date: "2026-09-05", value: 55.6 },
  { date: "2026-09-12", value: 55.8 }, { date: "2026-09-19", value: 55.7 }, { date: "2026-09-26", value: 56.0 },
  { date: "2026-10-02", value: 56.1 },
];

export const PREVIEW_STRENGTH = [
  { date: "2026-08-01", value: 40 }, { date: "2026-08-08", value: 40 }, { date: "2026-08-15", value: 42.5 },
  { date: "2026-08-22", value: 42.5 }, { date: "2026-08-29", value: 45 }, { date: "2026-09-05", value: 45 },
  { date: "2026-09-12", value: 47.5 }, { date: "2026-09-19", value: 47.5 }, { date: "2026-09-26", value: 50 },
  { date: "2026-10-02", value: 50 },
];

export const PREVIEW_EXERCISE = {
  name: "Incline Dumbbell Press",
  muscle: "Upper chest",
  equipment: "Dumbbells · 30° bench",
  cue: "Lower to the sides of your upper chest, pause, press slightly together.",
  stats: [
    { label: "Best", value: "16 kg × 10" },
    { label: "Est. 1RM", value: "21.3 kg" },
    { label: "Sessions", value: "14" },
  ],
};
