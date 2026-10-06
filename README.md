# Forge

**Build strength. Track progress. Eat smarter.**

A local-first gym workout planner, workout tracker and South Indian food & calorie tracker. No backend, no accounts: everything lives in your browser's `localStorage`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

On first launch, either complete onboarding or choose **Explore with demo data** (about 9 weeks of workouts, 30 days of food logs, plus weigh-ins and measurements).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · Motion · Recharts · date-fns · React Hook Form + Zod · Sonner · next-themes · Lucide

## Structure

```
src/
  app/                 Routes. (app)/ is the shell with sidebar + bottom nav; /session is full-screen
  data/                All static data
    foods.ts           218 Indian / South Indian foods with serving options
    exercises.ts       37 exercises + centralised image map (exerciseImages)
    workouts.ts        Starter workout templates
    constants.ts       Storage keys, goals, activity multipliers, macro rules, meals
    demoData.ts        Deterministic demo data generator
    landing.ts         Marketing copy for the landing page
  lib/
    types.ts           Domain types
    storage.ts         The only place that touches localStorage (safe read/write, quota detection)
    calculations.ts    BMI, BMR (Mifflin-St Jeor), TDEE, goal calories, macro targets
    workout-stats.ts   Volume, Epley 1RM, PR detection, muscle balance, streaks
    nutrition.ts       Food search, smart text parsing ("2 idli, 150g chicken")
    summaries.ts       Weekly review, daily summary, rule-based insights
    schemas.ts         Zod schemas (import validation)
  store/forge-store.ts Single external store (useSyncExternalStore) + all actions
  components/          ui/ (shadcn, restyled), shared/, charts/, landing/, dashboard/,
                       workout/, nutrition/, progress/, body/, layout/
```

### localStorage keys

`forge_profile`, `forge_settings`, `forge_workouts` (plans), `forge_workout_history`, `forge_active_session`, `forge_food_logs`, `forge_weight_history`, `forge_measurements`, `forge_water_logs`, `forge_progress_photos`, `forge_theme`.

Weights are always stored in kg and lengths in cm. Conversion to lb / ft-in happens only at display and input time.

## Notes

- **Estimates.** Calorie, macro and body calculations use standard formulas and are labelled as estimates, not medical advice. Food values are approximate home-style values.
- **Exercise photos** come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, Unlicense). They're loaded from GitHub, and an SVG illustration is shown if one fails to load.
- **Progress photos** are compressed to ~720px JPEG before saving. Browser storage is around 5 MB, so Settings shows how much is used. Export regularly.
- **Data management:** Settings → Export (JSON), Import (validated with Zod, confirms before replacing), Load demo data, Start fresh, Reset.
- **Shortcuts:** `⌘K` / `Ctrl K` opens global search across pages, workouts, exercises and foods.
