# Interactive Cooking Mode

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints. Data model in 03-data-model-and-storage.md. CRUD in 05-recipes-crud.md.

## Goal
Make the app genuinely useful while cooking — not just for recipe storage.

## Session Lifecycle
1. User taps "Start Cooking" on Recipe Detail screen
2. App creates or resumes `ActiveCookingSession` for this recipeId
3. Cooking Mode screen opens (`app/(stack)/recipes/[id]/cook.tsx`)
4. User interacts with ingredient/step checklists, timers, and servings adjuster
5. Progress persists to SQLite on each interaction
6. User taps "Mark as Cooked" → session `completedAt` set, recipe `lastCookedAt` updated
7. App navigates back to Recipe Detail

## ActiveCookingSession Fields
```typescript
interface ActiveCookingSession {
  id: string
  recipeId: string
  servingsOverride: number | null   // null = use recipe.servings
  checkedIngredientIds: string      // JSON array e.g. '["id1","id2"]'
  checkedStepIds: string            // JSON array e.g. '["id3"]'
  startedAt: string
  updatedAt: string
  completedAt: string | null
}
```

## Servings Scaling Rules
- Scale factor = `servingsOverride / recipe.servings`
- Apply to numeric `quantity` fields only
- Quantities that are null or zero are left unchanged
- Format scaled values: avoid ugly decimals (prefer fractions for halves, quarters; round to 1 decimal for small values, whole numbers when result is integer)
- Scaling is display-only — does not mutate stored ingredient data

## Timer Behavior
- Steps with `durationMinutes > 0` show a "Start Timer" button
- Tapping starts a countdown timer displayed in-screen
- Support multiple concurrent timers (one per step)
- Timer state lives in Zustand (not SQLite) — timers reset if app is force-quit
- Show visual alert and vibration when timer completes (use `expo-haptics` and local notification or in-app alert)

## UX Requirements
- Large typography: body minimum 18sp, step instructions minimum 22sp
- Minimum touch target: 44x44pt for all interactive elements
- Servings adjuster: minus / value / plus row at top of screen
- Ingredients section: scrollable checklist, checkbox + name + scaled quantity
- Steps section: numbered list, checkbox + instruction + optional timer button
- Progress indicator: "Step X of Y" prominently displayed
- Previous/Next step navigation buttons
- Keep screen awake during active session (`expo-keep-awake`)
- Minimal chrome — hide non-essential navigation elements

## Cooking Mode Zustand Store
```typescript
interface CookingStore {
  session: ActiveCookingSession | null
  recipe: Recipe | null
  ingredients: Ingredient[]
  steps: Step[]
  currentStepIndex: number
  timers: Record<string, TimerState>   // stepId → timer
  startSession(recipeId: string): Promise<void>
  resumeSession(session: ActiveCookingSession): void
  toggleIngredient(ingredientId: string): void
  toggleStep(stepId: string): void
  setServingsOverride(servings: number): void
  setCurrentStep(index: number): void
  startTimer(stepId: string, durationSeconds: number): void
  cancelTimer(stepId: string): void
  completeSession(): Promise<void>
}

interface TimerState {
  stepId: string
  totalSeconds: number
  remainingSeconds: number
  running: boolean
  completedAt: string | null
}
```

## Persistence Strategy
- On every checklist toggle or servings change: write updated `ActiveCookingSession` to SQLite immediately
- On session complete: set `completedAt` on session, update `recipe.lastCookedAt`, enqueue sync mutation
- On app resume: check for incomplete session for current recipeId and resume if found

## Implementation Tasks
- [ ] Build Cooking Mode screen `app/(stack)/recipes/[id]/cook.tsx` with large-typography layout, servings adjuster, ingredients checklist, steps checklist with timer buttons, previous/next step navigation, and "Mark as Cooked" CTA
- [ ] Implement `CookingSessionRepository` in `infra/db/repositories/cooking-session-repository.ts` with createOrResume, update (persist checklist state), complete (set completedAt and update recipe.lastCookedAt), and getActiveForRecipe methods
- [ ] Implement Cooking Mode Zustand store in `features/cooking/store.ts` including timer state management with per-step countdown, toggleIngredient (update SQLite + store), toggleStep (update SQLite + store), setServingsOverride, completeSession
- [ ] Implement `scaleQuantity(quantity: number | null, factor: number): string` utility in `shared/utils/servings.ts` that handles null passthrough, integer results, one-decimal rounding, and simple fraction formatting (½, ¼, ¾)
- [ ] Integrate `expo-keep-awake` to activate on cooking mode mount and deactivate on unmount
- [ ] Integrate `expo-haptics` for timer completion feedback
- [ ] Add unit tests for scaleQuantity covering: null input, integer result, decimal result, fraction formatting, scale factor of 1.0
- [ ] Add integration test for full cooking session flow: start session → toggle ingredients → toggle steps → complete session → verify recipe.lastCookedAt updated
