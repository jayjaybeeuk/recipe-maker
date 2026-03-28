# Phase 2 — Recipe Core

> **Working directory:** `/Users/jamesbolton/Documents/GIT/Personal/Recipe-Maker`
> **Package manager:** npm
> **Goal:** Full recipe CRUD working locally — repositories, screens, forms, and favorites all connected end-to-end. Every task must leave the repo in a buildable state.

---

## Foundation context (Phase 1 completed)

- Expo Router is configured with 5 tabs (`index`, `recipes`, `collections`, `search`, `settings`) and stack screens (`recipes/[id]`, `recipes/new`, `recipes/[id]/edit`, `recipes/[id]/cook`)
- All screens are currently placeholders (`<Text>Recipes</Text>` etc.)
- NativeWind is configured with a warm brand colour palette (`brand-500` = `#dc8a2a`)
- `shared/components/ui/` contains: Button, Card (+ CardHeader/Content/Footer/Title/Description), Input, Badge, Separator, Skeleton, Text (typography), Checkbox — all exported from `shared/components/ui/index.ts`
- Zustand stores exist as stubs in `features/recipes/store.ts`, `features/search/store.ts`, `features/cooking/store.ts`, `infra/auth/store.ts`, `infra/sync/store.ts`
- `shared/types/index.ts` has minimal types: `Recipe` (id, title, isFavorite, syncStatus, createdAt, updatedAt), `ActiveCookingSession`, `TimerState`, `SortOption`
- `infra/db/migration-runner.ts` exists with `getDb()` and `runMigrations()` — database is `recipe_maker.db` with all 9 tables already defined
- `infra/db/repositories/` is empty (only `.gitkeep`)
- Installed packages relevant to this phase: `expo-sqlite`, `zustand`, `nativewind`, `@rn-primitives/portal`, `@rn-primitives/slot`
- NOT yet installed: `zod`, `react-hook-form`, `@hookform/resolvers`, `expo-image-picker`

---

## Task 1 — Install dependencies, expand TypeScript types, and create Zod schemas

- [x] Install Phase 2 dependencies: `npm install zod react-hook-form @hookform/resolvers expo-image-picker expo-crypto`. Then expand `shared/types/index.ts` — replace the minimal `Recipe` interface with the full set of domain interfaces, and add all remaining entity types. The file should export:

  ```typescript
  // Enums / literals
  export type SortOption = 'newest' | 'updated' | 'favorite' | 'quickest' | 'rated' | 'lastCooked'
  export type Difficulty = 'easy' | 'medium' | 'hard'
  export type SyncStatus = 'pending' | 'synced' | 'failed'

  // Core entities
  export interface Recipe {
    id: string
    title: string
    description: string | null
    prepTimeMinutes: number | null
    cookTimeMinutes: number | null
    servings: number | null
    difficulty: Difficulty | null
    cuisine: string | null
    mealType: string | null
    sourceUrl: string | null
    notes: string | null
    rating: number | null
    isFavorite: boolean
    imageUri: string | null
    createdAt: string
    updatedAt: string
    lastCookedAt: string | null
    deletedAt: string | null
    syncStatus: SyncStatus
    searchText: string
    searchIngredients: string
    searchTags: string
  }

  export interface Ingredient {
    id: string
    recipeId: string
    name: string
    quantity: number | null
    unit: string | null
    optional: boolean
    sortOrder: number
  }

  export interface Step {
    id: string
    recipeId: string
    instruction: string
    durationMinutes: number | null
    sortOrder: number
  }

  export interface Tag {
    id: string
    name: string
  }

  export interface Collection {
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
  }

  export interface ActiveCookingSession {
    id: string
    recipeId: string
    servingsOverride: number | null
    checkedIngredientIds: string[]
    checkedStepIds: string[]
    startedAt: string
    updatedAt: string
    completedAt: string | null
  }

  export interface TimerState {
    stepId: string
    totalSeconds: number
    remainingSeconds: number
    running: boolean
  }

  // Input types for create/update operations
  export interface IngredientInput {
    name: string
    quantity: number | null
    unit: string | null
    optional: boolean
  }

  export interface StepInput {
    instruction: string
    durationMinutes: number | null
  }

  export interface CreateRecipeInput {
    title: string
    description?: string
    prepTimeMinutes?: number
    cookTimeMinutes?: number
    servings?: number
    difficulty?: Difficulty
    cuisine?: string
    mealType?: string
    sourceUrl?: string
    notes?: string
    rating?: number
    isFavorite?: boolean
    imageUri?: string
    ingredients: IngredientInput[]
    steps: StepInput[]
    tags: string[]
  }

  export type UpdateRecipeInput = Partial<CreateRecipeInput>

  export interface RecipeQuery {
    searchText?: string
    cuisine?: string
    mealType?: string
    tags?: string[]
    isFavorite?: boolean
    maxTotalMinutes?: number
    sortBy?: SortOption
    limit?: number
    offset?: number
  }
  ```

  Then create `shared/types/schemas.ts` with Zod schemas (import from `zod`):

  ```typescript
  import { z } from 'zod'

  export const ingredientInputSchema = z.object({
    name: z.string().min(1, 'Ingredient name is required'),
    quantity: z.number().positive().nullable().optional().default(null),
    unit: z.string().nullable().optional().default(null),
    optional: z.boolean().default(false),
  })

  export const stepInputSchema = z.object({
    instruction: z.string().min(1, 'Step instruction is required'),
    durationMinutes: z.number().int().positive().nullable().optional().default(null),
  })

  export const recipeFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    cuisine: z.string().optional(),
    mealType: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    prepTimeMinutes: z.number().int().positive().optional(),
    cookTimeMinutes: z.number().int().positive().optional(),
    servings: z.number().int().positive().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    notes: z.string().optional(),
    imageUri: z.string().optional(),
    ingredients: z.array(ingredientInputSchema).min(1, 'At least one ingredient is required'),
    steps: z.array(stepInputSchema).min(1, 'At least one step is required'),
    tags: z.array(z.string()).default([]),
  })

  export type RecipeFormValues = z.infer<typeof recipeFormSchema>
  ```

  Update `shared/types/index.ts` to also re-export from schemas: `export * from './schemas'`. Run `npx tsc --noEmit` from the project root and fix any TypeScript errors that arise across existing store files due to the expanded Recipe type.

---

## Task 2 — Build all database repositories

- [x] Create the following repository files in `infra/db/repositories/`. All files import `getDb` from `../../migration-runner`. All IDs are generated using `expo-crypto`: `import * as Crypto from 'expo-crypto'` then `Crypto.randomUUID()`. All timestamps are `new Date().toISOString()`. Use parameterized queries (no string interpolation of user data).

  **`infra/db/repositories/sync-queue-repository.ts`**
  ```typescript
  // Methods:
  // enqueue(entry: Omit<SyncQueueEntry, 'id' | 'createdAt' | 'retryCount' | 'lastError' | 'status'>): Promise<void>
  // dequeuePending(): Promise<SyncQueueEntry[]>
  // markFailed(id: string, error: string): Promise<void>
  // clearEntry(id: string): Promise<void>
  ```

  **`infra/db/repositories/ingredient-repository.ts`**
  ```typescript
  // Methods:
  // replaceForRecipe(recipeId: string, ingredients: IngredientInput[]): Promise<Ingredient[]>
  //   — deletes all existing rows for recipeId, inserts new rows with generated IDs and sortOrder = index
  // listByRecipeId(recipeId: string): Promise<Ingredient[]>
  ```

  **`infra/db/repositories/step-repository.ts`**
  ```typescript
  // Methods:
  // replaceForRecipe(recipeId: string, steps: StepInput[]): Promise<Step[]>
  //   — deletes all existing rows for recipeId, inserts new rows with generated IDs and sortOrder = index
  // listByRecipeId(recipeId: string): Promise<Step[]>
  ```

  **`infra/db/repositories/tag-repository.ts`**
  ```typescript
  // Methods:
  // findOrCreate(name: string): Promise<Tag>
  //   — normalize name to lowercase trimmed; INSERT OR IGNORE then SELECT
  // reconcileForRecipe(recipeId: string, tagNames: string[]): Promise<Tag[]>
  //   — find/create each tag, delete all recipe_tags for recipeId, insert new recipe_tags rows
  // listByRecipeId(recipeId: string): Promise<Tag[]>
  ```

  **`infra/db/repositories/recipe-repository.ts`**
  - Import `IngredientRepository`, `StepRepository`, `TagRepository`, `SyncQueueRepository`
  - Implement these methods:

  `createRecipe(input: CreateRecipeInput): Promise<Recipe>`
  1. Generate UUID for id
  2. Build `searchText` = `[title, description, notes].filter(Boolean).join(' ').toLowerCase()`
  3. INSERT into `recipes` table with all fields, syncStatus = `'pending'`
  4. Call `ingredientRepository.replaceForRecipe` and `stepRepository.replaceForRecipe`
  5. Call `tagRepository.reconcileForRecipe` and build `searchIngredients` / `searchTags` strings
  6. UPDATE `recipes` SET `search_ingredients`, `search_tags` where id = recipeId
  7. Enqueue `create` operation in sync_queue with full recipe payload
  8. Return the created recipe

  `updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe>`
  - Same as create but UPDATE existing row, replace children if provided, re-compute search helpers, enqueue `update`

  `deleteRecipe(id: string): Promise<void>`
  - SET `deleted_at` = now, `updated_at` = now, `sync_status` = `'pending'`
  - Enqueue `delete` operation

  `getRecipeById(id: string): Promise<Recipe | null>`
  - SELECT from recipes WHERE id = ? AND deleted_at IS NULL
  - Map DB row (snake_case) to TypeScript interface (camelCase)

  `listRecipes(query: RecipeQuery): Promise<Recipe[]>`
  - Build parameterized WHERE clauses from query fields:
    - searchText → `(search_text LIKE ? OR search_ingredients LIKE ? OR search_tags LIKE ?)` with `%term%`
    - cuisine → exact match
    - mealType → exact match
    - isFavorite → `is_favorite = 1`
    - maxTotalMinutes → `(prep_time_minutes + cook_time_minutes) <= ?`
  - Apply sortBy ORDER BY (see sort options in 06-search-filtering-and-indexing.md)
  - Always add `WHERE deleted_at IS NULL`
  - Apply LIMIT / OFFSET (default limit 100)
  - Map all rows

  `toggleFavorite(id: string, isFavorite: boolean): Promise<void>`
  - UPDATE `is_favorite`, `updated_at`, `sync_status` = `'pending'`
  - Enqueue `update`

  **`infra/db/repositories/collection-repository.ts`**
  ```typescript
  // Methods:
  // createCollection(name: string, description?: string): Promise<Collection>
  // listCollections(): Promise<Collection[]>
  // addRecipeToCollection(collectionId: string, recipeId: string): Promise<void>
  // removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<void>
  // listRecipesInCollection(collectionId: string): Promise<Recipe[]>
  //   — JOIN collection_recipes with recipes WHERE deleted_at IS NULL
  // deleteCollection(id: string): Promise<void>
  ```

  Create `infra/db/repositories/index.ts` that exports all repository classes and instantiates them as singletons:
  ```typescript
  export const syncQueueRepository = new SyncQueueRepository()
  export const ingredientRepository = new IngredientRepository()
  export const stepRepository = new StepRepository()
  export const tagRepository = new TagRepository()
  export const recipeRepository = new RecipeRepository(ingredientRepository, stepRepository, tagRepository, syncQueueRepository)
  export const collectionRepository = new CollectionRepository()
  ```

  Create a shared DB row mapper utility at `infra/db/mappers.ts` with `rowToRecipe(row: Record<string, unknown>): Recipe` that maps snake_case DB columns to the camelCase TypeScript interface. Run `npx tsc --noEmit` and fix any errors.

---

## Task 3 — Wire Zustand recipe store to repositories

- [x] Replace the stub `features/recipes/store.ts` with a fully wired store that calls `recipeRepository` from `infra/db/repositories/index.ts`. The store must have:

  ```typescript
  interface RecipeStore {
    recipes: Recipe[]
    selectedRecipe: Recipe | null
    ingredients: Ingredient[]     // for selected recipe
    steps: Step[]                 // for selected recipe
    tags: Tag[]                   // for selected recipe
    isLoading: boolean
    error: string | null

    // Actions
    loadRecipes(query?: RecipeQuery): Promise<void>
    loadRecipeById(id: string): Promise<void>
    createRecipe(input: CreateRecipeInput): Promise<Recipe>
    updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe>
    deleteRecipe(id: string): Promise<void>
    toggleFavorite(id: string, isFavorite: boolean): Promise<void>
    clearSelected(): void
  }
  ```

  - `loadRecipes` sets `isLoading: true`, calls `recipeRepository.listRecipes(query ?? {})`, sets `recipes`, clears `isLoading`
  - `loadRecipeById` fetches recipe + calls `ingredientRepository.listByRecipeId` + `stepRepository.listByRecipeId` + `tagRepository.listByRecipeId`, sets `selectedRecipe`, `ingredients`, `steps`, `tags`
  - `createRecipe` / `updateRecipe` call repository, then call `loadRecipes()` to refresh list
  - `toggleFavorite` calls repository then optimistically updates the recipe in `recipes` array (find and replace) without full reload
  - `deleteRecipe` calls repository, removes recipe from `recipes` array, clears `selectedRecipe` if matching

  Errors must be caught and set on `error` field; `isLoading` must always be cleared in finally block. Run `npx tsc --noEmit` and fix any errors.

---

## Task 4 — Build RecipeCard component and Recipes list screen

- [x] Create `shared/components/RecipeCard.tsx`. It must extend the `rnr` Card component and display:
  - Recipe photo (`imageUri`) as a thumbnail using `<Image>` from `react-native` — show a warm placeholder view (`bg-brand-100`) if `imageUri` is null
  - Title in bold using the `rnr` Text component (`variant="h3"`)
  - Horizontal row of tag Badges (`rnr` Badge, `variant="secondary"`) — show up to 3 tags
  - Total time display (prep + cook minutes) with a clock icon placeholder text if available
  - Favorite indicator — a filled/outline star icon (use Unicode `★` / `☆` or any simple indicator) shown as a `rnr` Button `variant="ghost"`
  - The entire card is pressable (use `Pressable` from react-native) and calls an `onPress` prop
  - Props: `recipe: Recipe`, `tags: Tag[]`, `onPress: () => void`, `onToggleFavorite: () => void`
  - Apply NativeWind classes for layout, spacing, and brand colours
  - Minimum touch target 44pt on the favorite button

  Then replace `app/(tabs)/recipes.tsx` with a real implementation:
  - Import `useRecipeStore` from `features/recipes/store`
  - Call `loadRecipes()` on mount using `useEffect`
  - Show a `FlatList` of `RecipeCard` components
  - Show `rnr` Skeleton placeholders while `isLoading` is true (3 skeleton cards)
  - Show an `EmptyState` view (create `shared/components/EmptyState.tsx` — accepts `title`, `message`, `action?: { label: string; onPress: () => void }`) when `recipes` is empty
  - Tapping a card navigates to `/(stack)/recipes/[id]` using `router.push` from `expo-router`
  - Tapping the favorite star calls `toggleFavorite`
  - Add a floating "+" button (or header right button) that navigates to `/(stack)/recipes/new`

---

## Task 5 — Build Recipe Detail screen

- [x] Replace `app/(stack)/recipes/[id].tsx` with a full detail screen:
  - Extract `id` from route params using `useLocalSearchParams` from `expo-router`
  - On mount, call `store.loadRecipeById(id)` from `useRecipeStore`
  - Show `rnr` Skeleton while loading
  - Layout (scrollable):
    1. **HeroImage** — full-width image if `recipe.imageUri` exists, else warm branded placeholder (`bg-brand-100` with recipe initial letter). Create `shared/components/HeroImage.tsx` accepting `uri: string | null` and `title: string`
    2. **Header row** — title (Text h1), favorite toggle button (★/☆ using `rnr` Button ghost), edit button navigating to `/(stack)/recipes/[id]/edit`
    3. **Metadata chips** — using `rnr` Badge: cuisine, mealType, difficulty, prep time, cook time, servings, rating (★ × rating)
    4. **Ingredients section** — `rnr` Separator + heading + list of ingredients (quantity + unit + name, optional items marked with "(optional)")
    5. **Steps section** — `rnr` Separator + heading + numbered list of step instructions, each with optional duration badge
    6. **Notes section** — show only if `recipe.notes` is not null
    7. **Source link** — show only if `recipe.sourceUrl` is not null (plain Text, not a pressable link in MVP)
    8. **"Start Cooking" CTA** — `rnr` Button full-width primary, navigates to `/(stack)/recipes/[id]/cook`
  - Header back button uses expo-router default
  - Favorite toggle calls `store.toggleFavorite(id, !recipe.isFavorite)`

---

## Task 6 — Build Add Recipe and Edit Recipe screens with React Hook Form

- [x] Install `@hookform/resolvers` is already included in Task 1. Build a shared form component `features/recipes/components/RecipeForm.tsx` used by both Add and Edit screens. The form uses `useForm` from `react-hook-form` with `zodResolver(recipeFormSchema)` from `@hookform/resolvers/zod`.

  Form sections (rendered in a `ScrollView`):

  **Section 1 — Basic info**
  - `rnr` Input fields for: title (required, autofocus), description, cuisine, mealType
  - Picker or plain Input for difficulty (`easy` / `medium` / `hard`)
  - Numeric inputs for: prepTimeMinutes, cookTimeMinutes, servings, rating (1-5)
  - Input for sourceUrl

  **Section 2 — Ingredients**
  - Dynamic list of ingredient rows managed with `useFieldArray`
  - Each row: name Input, quantity Input (numeric), unit Input, optional Checkbox
  - Up/down reorder buttons (simple swap, no drag-and-drop in MVP)
  - "Add ingredient" Button appends a new empty row
  - Validation error shown inline below name field

  **Section 3 — Steps**
  - Dynamic list of step rows managed with `useFieldArray`
  - Each row: instruction Input (multiline), durationMinutes Input (numeric), up/down buttons
  - "Add step" Button appends a new empty row

  **Section 4 — Tags**
  - Simple text Input that adds a tag on submit (comma-separated or enter key)
  - Displays existing tags as dismissible `rnr` Badge chips

  **Section 5 — Notes**
  - Multiline `rnr` Input for notes

  **Section 6 — Image**
  - Create `shared/components/ImagePickerField.tsx`: shows current image or placeholder, tapping opens `expo-image-picker` (camera or library), stores the local URI
  - Wire to form's `imageUri` field

  Props for `RecipeForm`:
  ```typescript
  interface RecipeFormProps {
    defaultValues?: Partial<RecipeFormValues>
    onSubmit: (values: RecipeFormValues) => Promise<void>
    isSubmitting: boolean
  }
  ```

  Build `app/(stack)/recipes/new.tsx`:
  - Renders `RecipeForm` with empty defaultValues
  - `onSubmit` calls `store.createRecipe(values)` then `router.back()`
  - Header title "New Recipe"

  Build `app/(stack)/recipes/[id]/edit.tsx`:
  - On mount loads recipe by id from store
  - Renders `RecipeForm` pre-populated with existing recipe data (map Recipe → RecipeFormValues)
  - `onSubmit` calls `store.updateRecipe(id, values)` then `router.back()`
  - Header title "Edit Recipe"
  - Add a "Delete" action (header right or bottom button) — shows `Alert.alert` confirmation, on confirm calls `store.deleteRecipe(id)` then `router.replace('/(tabs)/recipes')`
  - Header title "Edit Recipe"

---

## Task 7 — Build Home screen and Collections screen

- [x] Replace `app/(tabs)/index.tsx` (Home screen) with a real implementation:
  - On mount call `store.loadRecipes({ isFavorite: true, limit: 10, sortBy: 'newest' })` for favorites and a second load for recently cooked (`sortBy: 'lastCooked', limit: 5`)
  - Use two separate local state variables or two Zustand selectors for the two lists
  - Layout (ScrollView):
    1. **Favorites section** — horizontal `FlatList` of compact `RecipeCard` components (or a simpler thumbnail-only card for horizontal layout). Show `EmptyState` if none.
    2. **Recently Cooked section** — vertical list of 3-5 `RecipeCard` items. Show `EmptyState` if none.
    3. **Quick actions** — two `rnr` Button components: "Browse All Recipes" (navigates to recipes tab) and "Add Recipe" (navigates to `/(stack)/recipes/new`)
  - Screen title: "My Cookbook"

  Replace `app/(tabs)/collections.tsx` with a basic implementation:
  - Import `collectionRepository` from `infra/db/repositories/index.ts`
  - Load collections on mount
  - Show `FlatList` of collection `rnr` Card components (name, description, count placeholder)
  - Show `EmptyState` when empty with a "Create Collection" CTA (show `Alert.prompt` for name input on iOS / `TextInput` modal on Android — keep it simple)
  - Tapping a collection navigates to `/(stack)/collections/[id]`

  Create `app/(stack)/collections/[id].tsx`:
  - Load collection detail and its recipes via `collectionRepository.listRecipesInCollection(id)`
  - Show list of `RecipeCard` components
  - Header title = collection name
  - Back navigates to collections tab

---

## Task 8 — Unit tests for repositories and Zod schemas

- [x] Write unit tests using Vitest. The test environment uses `node` (no React Native renderer needed for repository tests). Mock `expo-sqlite` and `expo-crypto` at the top of each repository test file using `vi.mock`.

  **`infra/db/repositories/__tests__/recipe-repository.test.ts`**
  - Mock `getDb` to return an in-memory mock DB object with `execAsync`, `runAsync`, `getFirstAsync`, `getAllAsync` methods that track calls
  - Test: `createRecipe` inserts recipe row and enqueues sync entry
  - Test: `updateRecipe` updates existing row
  - Test: `deleteRecipe` sets `deleted_at` and enqueues delete
  - Test: `listRecipes` with no filters returns all non-deleted
  - Test: `listRecipes` with `isFavorite: true` adds correct WHERE clause
  - Test: `listRecipes` with `searchText` adds LIKE clause
  - Test: `toggleFavorite` updates `is_favorite` field
  - Test: `getRecipeById` returns null for deleted recipe

  **`shared/types/__tests__/schemas.test.ts`**
  - Test: valid complete recipe form passes validation
  - Test: missing title fails with 'Title is required'
  - Test: empty ingredients array fails with 'At least one ingredient is required'
  - Test: empty steps array fails with 'At least one step is required'
  - Test: invalid URL in sourceUrl fails with 'Must be a valid URL'
  - Test: rating of 6 fails (max 5)
  - Test: rating of 0 fails (min 1)
  - Test: sourceUrl of empty string `''` passes (allowed)
  - Test: ingredient with empty name fails

  Run `npm test` and confirm all tests pass. Run `npx tsc --noEmit` and confirm 0 errors.

---

## Human verification steps (do not use checkbox syntax — these require manual action)

- Run `npm start` and open on iOS simulator or device
- Navigate to the Recipes tab — confirm the empty state shows with an "Add Recipe" prompt
- Tap "Add Recipe", fill in title + one ingredient + one step, save — confirm the recipe appears in the list
- Tap the recipe card — confirm detail screen shows all fields
- Tap the star — confirm favorite state toggles
- Tap Edit — confirm form is pre-populated
- Change the title, save — confirm list updates
- Long-press or use the delete action — confirm recipe disappears from list
- Navigate to Home tab — confirm favorites section reflects the favorited recipe
- Run `npm run typecheck` → exits 0
- Run `npm run lint` → exits 0
- Run `npm test` → all tests pass
