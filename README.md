# Workout Logger PWA

Offline-first workout logging app built with React, Vite, TypeScript, and IndexedDB. Installable as a PWA and optimised for thumb-friendly logging with large tap targets and numeric inputs.

## Running locally

```bash
npm install
npm run dev
```

## Key features
- Workout templates (seeded with Push, Pull, Legs on first run)
- Start a workout from a template and log ordered sets with weight and reps
- Quick weight reuse by focusing the next set
- Delete sets, auto-add a new empty set after saving
- View last session summary per exercise and drill into exercise history
- IndexedDB storage through a single `workoutStore` module
- PWA setup via `vite-plugin-pwa` for offline caching and installability
