# Phase 4 — Interactive Cooking Mode

> **Working directory:** `/Users/jamesbolton/Documents/GIT/Personal/Recipe-Maker`
> **Package manager:** npm
> **Goal:** A fully functional cooking mode — session persistence, ingredient/step checklists, servings scaling, per-step countdown timers, keep-screen-awake, and haptic feedback on timer completion.

---

## Foundation context (Phases 1–3 completed)

- `shared/types/index.ts` exports: `Recipe`, `Ingredient`, `Step`, `Tag`, `ActiveCookingSession` (note: `checkedIngredientIds` and `checkedStepIds` are `string[]` in the TypeScript type but stored as JSON text in SQLite — the repository must serialise/deserialise)
- `infra/db/repositories/` contains: `RecipeRepository`, `IngredientRepository`, `StepRepository`, `TagRepository`, `CollectionRepository`, `SyncQueueRepository` — all exported from `infra/db/repositories/index.ts` and stubbed in `infra/db/repositories/index.web.ts`
- `infra/db/migration-runner.ts` — `getDb()` and `runMigrations()` — database includes `active_cooking_sessions` table with columns: `id`, `recipe_id`, `servings_override`, `checked_ingredient_ids` (TEXT, JSON), `checked_step_ids` (TEXT, JSON), `started_at`, `updated_at`, `completed_at`
- `features/cooking/store.ts` — `useCookingStore` stub with: `session`, `currentStepIndex`, `timers`, and actions `setSession`, `setCurrentStep`, `startTimer`, `cancelTimer`, `clearSession` — needs full replacement
- `app/(stack)/recipes/[id]/cook.tsx` — placeholder, renders `<Text>Cooking Mode: {id}</Text>`
- `features/recipes/store.ts` — `useRecipeStore` with `loadRecipeById(id)` which populates `selectedRecipe`, `ingredients`, `steps`, `tags`
- `shared/components/ui/` — Button, Card, Input, Badge, Separator, Skeleton, Text, Checkbox
- `shared/components/EmptyState.tsx`, `HeroImage.tsx` exist
- NOT yet installed: `expo-keep-awake`, `expo-haptics`
- NOT yet created: `CookingSessionRepository`, `shared/utils/servings.ts`

---

## Task 1 — Install dependencies and build the scaleQuantity utility

- [x] Install cooking mode dependencies: `npm install expo-keep-awake expo-haptics`. Then create `shared/utils/servings.ts` exporting:

  ```typescript
  /**
   * Scales a recipe ingredient quantity by a factor and returns a display string.
   * Returns null passthrough as empty string.
   * Formats results to avoid ugly decimals:
   *   - Integer results → whole number string ("2", "3")
   *   - Exact halves → "½"
   *   - Exact quarters → "¼"
   *   - Exact three-quarters → "¾"
   *   - Otherwise → one decimal place, trailing zero stripped ("1.5", "0.3")
   */
  export function scaleQuantity(quantity: number | null, factor: number): string

  /**
   * Formats a duration in seconds to a MM:SS display string.
   * e.g. 90 → "1:30", 65 → "1:05"
   */
  export function formatDuration(totalSeconds: number): string
  ```

  Implementation rules for `scaleQuantity`:
  - If `quantity` is null or factor is 0, return `''`
  - Scale: `scaled = quantity * factor`
  - If `Math.round(scaled) === scaled` (integer result): return `String(Math.round(scaled))`
  - If `Math.abs(scaled - Math.round(scaled) + 0.5) < 0.01` (half): return `'½'`
  - If `Math.abs(scaled - Math.round(scaled) + 0.75) < 0.01` (quarter): return `'¼'`
  - If `Math.abs(scaled - Math.round(scaled) + 0.25) < 0.01` (three-quarter): return `'¾'`
  - Otherwise: return `scaled.toFixed(1).replace(/\.0$/, '')`

  Run `npx tsc --noEmit` and fix any errors.

---

## Task 2 — Build CookingSessionRepository and update the repository index

- [x] Create `infra/db/repositories/cooking-session-repository.ts`. Import `getDb` from `../../migration-runner` and `Crypto` from `expo-crypto`. All timestamps are `new Date().toISOString()`.

  **Methods:**

  `createOrResume(recipeId: string, servingsOverride?: number): Promise<ActiveCookingSession>`
  - First check for an existing incomplete session: `SELECT * FROM active_cooking_sessions WHERE recipe_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1`
  - If found: return it (deserialise `checked_ingredient_ids` and `checked_step_ids` from JSON text to `string[]`)
  - If not found: INSERT a new session row with generated UUID, `recipe_id`, `servings_override` (or null), empty JSON arrays `'[]'` for checked fields, `started_at = now`, `updated_at = now`, `completed_at = NULL`
  - Return the created/resumed session as `ActiveCookingSession` (with `string[]` arrays)

  `updateChecklist(sessionId: string, checkedIngredientIds: string[], checkedStepIds: string[]): Promise<void>`
  - UPDATE `checked_ingredient_ids = ?`, `checked_step_ids = ?`, `updated_at = ?` WHERE `id = ?`
  - Serialise arrays with `JSON.stringify`

  `updateServings(sessionId: string, servingsOverride: number): Promise<void>`
  - UPDATE `servings_override = ?`, `updated_at = ?` WHERE `id = ?`

  `complete(sessionId: string, recipeId: string): Promise<void>`
  - UPDATE `completed_at = ?`, `updated_at = ?` WHERE `id = ?`
  - UPDATE `recipes SET last_cooked_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`
  - Enqueue a sync update for the recipe (call `getDb().runAsync` on the sync_queue directly — no need to import full SyncQueueRepository)

  `getActiveForRecipe(recipeId: string): Promise<ActiveCookingSession | null>`
  - SELECT incomplete session for recipeId
  - Return null if none, else deserialise and return

  **Helper:** create a private `rowToSession(row: Record<string, unknown>): ActiveCookingSession` function that maps snake_case DB columns and deserialises JSON array fields.

  Update `infra/db/repositories/index.ts` — add:
  ```typescript
  import { CookingSessionRepository } from './cooking-session-repository'
  export const cookingSessionRepository = new CookingSessionRepository()
  ```

  Update `infra/db/repositories/index.web.ts` — add stub:
  ```typescript
  export const cookingSessionRepository = {
    createOrResume: async () => { throw new Error('Not available on web') },
    updateChecklist: async () => {},
    updateServings: async () => {},
    complete: async () => {},
    getActiveForRecipe: async () => null,
  }
  ```

  Run `npx tsc --noEmit` and fix any errors.

---

## Task 3 — Replace cooking store with full implementation

- [x] Replace `features/cooking/store.ts` with a fully wired store. The store manages session state, timer countdowns (via `setInterval`), and persists checklist changes to SQLite on every toggle.

  ```typescript
  import { create } from 'zustand'
  import { cookingSessionRepository } from '@infra/db/repositories'
  import { ingredientRepository, stepRepository } from '@infra/db/repositories'
  import type { Recipe, Ingredient, Step, ActiveCookingSession, TimerState } from '@shared/types'

  interface CookingStore {
    // State
    session: ActiveCookingSession | null
    recipe: Recipe | null
    ingredients: Ingredient[]
    steps: Step[]
    currentStepIndex: number
    scaleFactor: number       // servingsOverride / recipe.servings (1.0 if either is null)
    timers: Record<string, TimerState>
    isLoading: boolean
    error: string | null

    // Actions
    startSession(recipeId: string, recipe: Recipe, ingredients: Ingredient[], steps: Step[]): Promise<void>
    toggleIngredient(ingredientId: string): Promise<void>
    toggleStep(stepId: string): Promise<void>
    setServingsOverride(servings: number): Promise<void>
    setCurrentStep(index: number): void
    startTimer(stepId: string, durationMinutes: number): void
    cancelTimer(stepId: string): void
    tickTimers(): void          // called by a setInterval in the screen
    completeSession(): Promise<void>
    clearSession(): void
  }
  ```

  Implementation details:

  **`startSession`:**
  1. Set `isLoading: true`
  2. Call `cookingSessionRepository.createOrResume(recipeId)`
  3. Set `session`, `recipe`, `ingredients`, `steps`
  4. Compute `scaleFactor` = `session.servingsOverride && recipe.servings ? session.servingsOverride / recipe.servings : 1.0`
  5. Set `isLoading: false`

  **`toggleIngredient`:**
  1. Compute new `checkedIngredientIds` array (add if absent, remove if present)
  2. Call `cookingSessionRepository.updateChecklist(session.id, newIngredientIds, session.checkedStepIds)`
  3. Update `session` in store with new arrays

  **`toggleStep`:** same pattern for `checkedStepIds`

  **`setServingsOverride`:**
  1. Call `cookingSessionRepository.updateServings(session.id, servings)`
  2. Update `session.servingsOverride` and recompute `scaleFactor`

  **`startTimer`:**
  - Set `timers[stepId] = { stepId, totalSeconds: durationMinutes * 60, remainingSeconds: durationMinutes * 60, running: true }`

  **`cancelTimer`:**
  - Remove `timers[stepId]` from map

  **`tickTimers`:**
  - For each running timer, decrement `remainingSeconds` by 1
  - If `remainingSeconds` reaches 0: set `running: false`, set `completedAt: new Date().toISOString()`
  - Update timers map immutably

  **`completeSession`:**
  1. Call `cookingSessionRepository.complete(session.id, session.recipeId)`
  2. Call `clearSession()`

  **`clearSession`:** reset all state to initial values, clear any running timer intervals (store interval IDs in a ref or use a module-level map)

---

## Task 4 — Build the Cooking Mode screen

- [x] Replace `app/(stack)/recipes/[id]/cook.tsx` with the full cooking mode implementation.

  **Setup:**
  - Extract `id` from `useLocalSearchParams<{ id: string }>()`
  - On mount:
    1. If `useRecipeStore().selectedRecipe?.id !== id`, call `useRecipeStore().loadRecipeById(id)` first
    2. Then call `useCookingStore().startSession(id, recipe, ingredients, steps)`
    3. Activate `useKeepAwake()` from `expo-keep-awake`
    4. Start a `setInterval(() => useCookingStore.getState().tickTimers(), 1000)` — clear on unmount
  - On unmount: clear the interval (do NOT complete the session — user must explicitly tap "Mark as Cooked")

  **Header:**
  - Use `useNavigation().setOptions({ headerShown: false })` — cooking mode uses its own minimal header bar
  - Render a custom top bar: back chevron (calls `router.back()`) on left, recipe title (truncated) in centre, progress "Step X of Y" on right

  **Layout** (`ScrollView` or split view):

  **Section 1 — Servings adjuster** (sticky at top or prominent row):
  ```
  [ − ]  [ 4 servings ]  [ + ]
  ```
  - Show `recipe.servings ?? 1` as base; if `session.servingsOverride` is set, show that
  - Minus button: decrement by 1 (min 1), call `store.setServingsOverride`
  - Plus button: increment by 1, call `store.setServingsOverride`
  - Use `rnr` Button `variant="outline"` for ±, `rnr` Text for the count

  **Section 2 — Ingredients checklist:**
  - Heading "Ingredients" (`rnr` Text variant h2)
  - `rnr` Separator
  - For each ingredient:
    - `rnr` Checkbox (checked = `session.checkedIngredientIds.includes(ingredient.id)`)
    - Scaled quantity + unit: `scaleQuantity(ingredient.quantity, scaleFactor) + ' ' + (ingredient.unit ?? '')`
    - Ingredient name (strikethrough style if checked: `line-through` via NativeWind)
    - "(optional)" suffix if `ingredient.optional`
    - `onPress` calls `store.toggleIngredient(ingredient.id)`
    - Minimum 44pt touch target

  **Section 3 — Steps:**
  - Heading "Method" (`rnr` Text variant h2)
  - `rnr` Separator
  - For each step:
    - Step number badge (`rnr` Badge)
    - `rnr` Checkbox (checked = `session.checkedStepIds.includes(step.id)`)
    - Instruction text (minimum 22sp — use `text-xl` or `text-2xl` NativeWind class; strikethrough if checked)
    - If `step.durationMinutes > 0`:
      - If timer not started: `rnr` Button `variant="outline"` "Start timer (Xmin)"
      - If timer running: display `formatDuration(timer.remainingSeconds)` countdown + "Cancel" button
      - If timer completed: "Done ✓" text + haptic feedback triggered once on completion
    - `onPress` on the row calls `store.toggleStep(step.id)`

  **Section 4 — Navigation and completion:**
  - Previous / Next step buttons (show only when > 1 step): `rnr` Button `variant="ghost"` — calls `store.setCurrentStep(index ± 1)`, clamped to valid range. Highlight the current step with a different background.
  - "Mark as Cooked" `rnr` Button (full width, primary) at bottom of scroll — shows `Alert.alert` confirmation "Mark this recipe as cooked?", on confirm calls `store.completeSession()` then `router.back()`

  **Timer haptics:**
  - When a timer transitions from `running: true` to `running: false` (remainingSeconds === 0), call `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` from `expo-haptics` and show an `Alert.alert('Timer done', step.instruction + ' is ready!')`
  - Detect this transition in a `useEffect` watching `timers`

  **Typography requirements:**
  - Step instruction text: minimum 22sp (`text-xl` = 20sp minimum; use `text-2xl` for readability)
  - Ingredient text: minimum 18sp (`text-lg`)
  - All interactive elements: minimum 44pt touch target

  Run `npx tsc --noEmit` and fix any errors.

---

## Task 5 — Unit tests for scaleQuantity and integration test for session lifecycle

- [ ] Create `shared/utils/__tests__/servings.test.ts` using Vitest. Import `scaleQuantity` and `formatDuration` from `shared/utils/servings`. No mocking needed — pure functions.

  **`scaleQuantity` tests:**
  - `scaleQuantity(null, 2)` → `''`
  - `scaleQuantity(1, 0)` → `''`
  - `scaleQuantity(2, 1)` → `'2'` (integer, scale factor 1.0)
  - `scaleQuantity(1, 2)` → `'2'` (integer result)
  - `scaleQuantity(3, 2)` → `'6'` (integer result)
  - `scaleQuantity(1, 0.5)` → `'½'` (half)
  - `scaleQuantity(2, 0.25)` → `'½'` (half via scaling)
  - `scaleQuantity(1, 0.25)` → `'¼'` (quarter)
  - `scaleQuantity(1, 0.75)` → `'¾'` (three-quarter)
  - `scaleQuantity(1, 1.5)` → `'1.5'` (decimal)
  - `scaleQuantity(1, 1.3)` → `'1.3'` (one decimal)
  - `scaleQuantity(1, 1.33)` → `'1.3'` (rounded to 1dp)
  - `scaleQuantity(0.5, 2)` → `'1'` (integer result from decimal input)

  **`formatDuration` tests:**
  - `formatDuration(0)` → `'0:00'`
  - `formatDuration(60)` → `'1:00'`
  - `formatDuration(90)` → `'1:30'`
  - `formatDuration(65)` → `'1:05'` (zero-padded seconds)
  - `formatDuration(3600)` → `'60:00'`

  **Integration test for session lifecycle:**

  Create `infra/db/repositories/__tests__/cooking-session-repository.test.ts`. Mock `expo-sqlite` (via `vi.mock`) and `expo-crypto` to return predictable UUIDs.

  - Test: `createOrResume` with no existing session → creates new session with empty checklist arrays
  - Test: `createOrResume` called twice for same recipeId → returns the same session (resume, not duplicate)
  - Test: `updateChecklist` → serialises arrays as JSON in DB update call
  - Test: `complete` → sets `completed_at` and updates `recipes.last_cooked_at`
  - Test: `getActiveForRecipe` → returns null when no active session exists
  - Test: `getActiveForRecipe` → returns session when incomplete session exists

  Run `npm test` and confirm all tests pass. Run `npx tsc --noEmit` and confirm 0 errors.

---

## Human verification steps (do not use checkbox syntax — these require manual action)

- Navigate to a recipe detail screen and tap "Start Cooking"
- Confirm cooking mode opens with the recipe title and step count in the header
- Confirm ingredients display with scaled quantities (servings × 1.0 = unchanged at default)
- Tap − to reduce servings — confirm quantities update immediately (e.g. 2 cups → 1 cup at half servings)
- Check an ingredient — confirm checkbox ticks and text gets strikethrough
- Check a step — confirm same behaviour
- Close the app and re-open, navigate back to cooking mode — confirm checked items are still ticked (session resumed)
- Tap "Start timer" on a step with a duration — confirm countdown begins
- Let timer reach 0 — confirm haptic fires and alert shows
- Tap "Mark as Cooked" — confirm alert prompt, then navigates back and recipe appears in "Recently Cooked" on Home screen
- Run `npm run typecheck` → exits 0
- Run `npm run lint` → exits 0
- Run `npm test` → all tests pass
