# Phase 3 — Search and Filtering

> **Working directory:** `/Users/jamesbolton/Documents/GIT/Personal/Recipe-Maker`
> **Package manager:** npm
> **Goal:** Full local recipe discovery — debounced search, filter chips, sort selector, recent searches, and results wired to both the Search screen and the Recipes screen.

---

## Foundation context (Phases 1 & 2 completed)

- All repositories exist in `infra/db/repositories/` — `RecipeRepository.listRecipes(query: RecipeQuery)` accepts `{ searchText, cuisine, mealType, tags, isFavorite, maxTotalMinutes, sortBy, limit, offset }` and returns `Recipe[]`
- `shared/types/index.ts` exports: `Recipe`, `Ingredient`, `Tag`, `SortOption`, `RecipeQuery`
- `shared/components/RecipeCard.tsx` — accepts `recipe`, `tags`, `onPress`, `onToggleFavorite`
- `shared/components/EmptyState.tsx` — accepts `title`, `message`, `action?`
- `shared/components/ui/index.ts` exports: `Button`, `Card`, `Input`, `Badge`, `Separator`, `Skeleton`, `Text`, `Checkbox`
- `features/search/store.ts` — `useSearchStore` exists with state: `searchText`, `cuisine`, `mealType`, `tags`, `isFavorite`, `maxTotalMinutes`, `sortBy` and actions: `setSearchText`, `setCuisine`, `setMealType`, `toggleTag`, `setIsFavorite`, `setMaxTotalMinutes`, `setSortBy`, `clearAll`
- `features/recipes/store.ts` — `useRecipeStore` with `loadRecipes(query?: RecipeQuery): Promise<void>`, `recipes: Recipe[]`, `isLoading: boolean`
- `app/(tabs)/search.tsx` — currently a placeholder (`<Text>Search</Text>`)
- `app/(tabs)/recipes.tsx` — real screen with FlatList of RecipeCards, no search/filter UI yet
- Installed packages: `zod`, `react-hook-form`, `expo-crypto`, `expo-image-picker`, `zustand`
- NOT yet installed: `@react-native-async-storage/async-storage`

---

## Task 1 — Install AsyncStorage and build the query builder utility

- [x] Install AsyncStorage: `npm install @react-native-async-storage/async-storage`. Then create `shared/utils/useDebounce.ts`:

  ```typescript
  import { useState, useEffect } from 'react'

  export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedV		alue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay)
      return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
  }
  ```

  Then create `features/search/query-builder.ts`. It must export:

  ```typescript
  export interface RecipeFilters {
    searchText: string
    cuisine: string | null
    mealType: string | null
    tags: string[]
    isFavorite: boolean
    maxTotalMinutes: number | null
    sortBy: SortOption
  }

  export interface BuiltQuery {
    sql: string
    params: (string | number)[]
  }

  export function buildRecipeQuery(filters: RecipeFilters, limit = 100, offset = 0): BuiltQuery
  ```

  The function must build a **single parameterized SQLite query** with no string interpolation of user values:

  ```sql
  SELECT r.*
  FROM recipes r
  WHERE r.deleted_at IS NULL
    [AND (r.search_text LIKE ? OR r.search_ingredients LIKE ? OR r.search_tags LIKE ?)]
    [AND r.cuisine = ?]
    [AND r.meal_type = ?]
    [AND r.is_favorite = 1]
    [AND (COALESCE(r.prep_time_minutes, 0) + COALESCE(r.cook_time_minutes, 0)) <= ?]
  ORDER BY ...
  LIMIT ? OFFSET ?
  ```

  Sort mappings:
  - `newest` → `r.created_at DESC`
  - `updated` → `r.updated_at DESC`
  - `favorite` → `r.is_favorite DESC, r.created_at DESC`
  - `quickest` → `(COALESCE(r.prep_time_minutes, 0) + COALESCE(r.cook_time_minutes, 0)) ASC`
  - `rated` → `r.rating DESC`
  - `lastCooked` → `r.last_cooked_at DESC`

  Rules:
  - `searchText` filter: only add if `filters.searchText.trim()` is non-empty; wrap term in `%term%` for LIKE
  - `isFavorite` filter: only add `AND r.is_favorite = 1` if `filters.isFavorite === true`
  - `tags` filter: if `filters.tags.length > 0`, add `AND r.search_tags LIKE ?` for each tag (separate AND clause per tag, each `%tagname%`)
  - `LIMIT` and `OFFSET` are always appended as the final two params
  - Always add `WHERE r.deleted_at IS NULL` as the base condition

  Export `RecipeFilters` from `shared/types/index.ts` as well (add `export type { RecipeFilters } from '../features/search/query-builder'` or co-locate the type in `shared/types/index.ts` and import it in the query builder — choose the approach that avoids circular imports).

  Run `npx tsc --noEmit` and fix any errors.

---

## Task 2 — Build SearchInput, FilterChips, and SortSelector components

- [x] Create `features/search/components/SearchInput.tsx`:
  - Wraps the `rnr` `Input` component
  - Props: `value: string`, `onChangeText: (text: string) => void`, `onSubmit?: () => void`, `placeholder?: string`, `autoFocus?: boolean`
  - Shows a clear (×) `rnr` Button `variant="ghost"` on the right when `value` is non-empty
  - Minimum touch target 44pt on the clear button
  - No internal debounce — the caller is responsible for debouncing (see Task 3)

  Create `features/search/components/FilterChips.tsx`:
  - Props: `filters: RecipeFilters`, `onRemoveCuisine: () => void`, `onRemoveMealType: () => void`, `onRemoveTag: (tag: string) => void`, `onClearFavorite: () => void`, `onClearTime: () => void`, `onClearAll: () => void`
  - Renders a horizontal `ScrollView` of active filter chips
  - Each active filter renders as a `rnr` Badge with a small "×" dismiss button embedded
  - Active filters to show (only render chip if filter is active):
    - cuisine → chip labelled cuisine value
    - mealType → chip labelled mealType value
    - each tag → chip labelled tag name
    - isFavorite === true → chip labelled "Favourites"
    - maxTotalMinutes !== null → chip labelled "≤ Xmin"
  - If 2+ chips are visible, show a "Clear all" `rnr` Button `variant="ghost"` at the end of the row
  - If no chips are active, render nothing (return null)

  Create `features/search/components/SortSelector.tsx`:
  - Props: `value: SortOption`, `onChange: (sort: SortOption) => void`
  - Renders a pressable row showing current sort label (e.g. "Newest first")
  - On press, opens an `ActionSheetIOS` on iOS (use `ActionSheetIOS` from `react-native`) or a simple `Modal` with a list of options on Android
  - Sort options and labels:
    - `newest` → "Newest first"
    - `updated` → "Recently updated"
    - `favorite` → "Favourites first"
    - `quickest` → "Quickest to make"
    - `rated` → "Highest rated"
    - `lastCooked` → "Recently cooked"
  - The active option is visually indicated (bold text or checkmark)
  - Export all three components from `features/search/components/index.ts`

---

## Task 3 — Recent search persistence and wired Search screen

- [x] Create `features/search/recent-searches.ts` using `@react-native-async-storage/async-storage`:

  ```typescript
  const STORAGE_KEY = 'recent_searches'
  const MAX_RECENT = 10

  export async function getRecentSearches(): Promise<string[]>
  // Returns stored list, newest first. Returns [] on error.

  export async function addRecentSearch(term: string): Promise<void>
  // Trim and lowercase term. Prepend to list, deduplicate, truncate to MAX_RECENT. No-op if term is empty.

  export async function removeRecentSearch(term: string): Promise<void>
  // Remove matching term from list.

  export async function clearRecentSearches(): Promise<void>
  // Clear all stored terms.
  ```

  Then replace `app/(tabs)/search.tsx` with a full implementation:

  **State:**
  - Read `searchText`, `cuisine`, `mealType`, `tags`, `isFavorite`, `maxTotalMinutes`, `sortBy` from `useSearchStore`
  - Local state: `inputValue: string` (the live text input, not debounced)
  - `debouncedSearchText` = `useDebounce(inputValue, 150)`
  - Local state: `recentSearches: string[]`
  - Local state: `results: Recipe[]`
  - Local state: `tagMap: Record<string, Tag[]>` — tags keyed by recipeId for RecipeCard rendering
  - Local state: `isLoading: boolean`

  **On mount:** load recent searches from `getRecentSearches()`.

  **When `debouncedSearchText` or any filter changes:** rebuild filters, call `buildRecipeQuery`, execute against `recipeRepository.listRecipes()`, update `results`. Also load tags for each result recipe via `tagRepository.listByRecipeId`.

  **Layout (full screen):**
  1. `SearchInput` at top, `autoFocus` on initial mount, `value={inputValue}`, `onChangeText` updates `inputValue`, `onSubmit` calls `addRecentSearch(debouncedSearchText)` and `store.setSearchText(debouncedSearchText)`
  2. `FilterChips` row below input (hidden when no active filters)
  3. Sort row: "Sort:" label + `SortSelector` component on the same line, right-aligned
  4. **When input is focused AND inputValue is empty AND recentSearches.length > 0:** show recent searches panel instead of results — render each as a pressable row with a clock icon prefix and individual delete (×) button; show "Clear all" at bottom
  5. **When results exist:** `FlatList` of `RecipeCard` components
  6. **When results empty and filters are active:** `EmptyState` with title "No recipes found" and message "Try adjusting your search or filters" and a "Clear filters" action calling `store.clearAll()`
  7. **When results empty and no filters:** `EmptyState` with title "Start searching" and message "Search by recipe name, ingredient, or tag"

  Wire `onToggleFavorite` on each RecipeCard to `useRecipeStore().toggleFavorite`.
  Wire `onPress` to `router.push('/(stack)/recipes/' + recipe.id)`.
  Run `npx tsc --noEmit` and fix any errors.

---

## Task 4 — Add search and filter UI to the Recipes screen

- [x] Update `app/(tabs)/recipes.tsx` to add search and filtering at the top of the screen. The Recipes screen should share the same `useSearchStore` as the Search tab so filters carry across both tabs.

  **Add to the Recipes screen above the FlatList:**
  1. A row containing: `SearchInput` (flex 1) + list/grid toggle button (use a simple icon text `☰` / `⊞` toggling `viewMode: 'list' | 'grid'` in local state)
  2. `FilterChips` row (hidden when no active filters)
  3. Sort row: "Sort:" label + `SortSelector`

  **Behaviour:**
  - `inputValue` is local state; `debouncedSearchText = useDebounce(inputValue, 150)`
  - When `debouncedSearchText` changes, call `store.setSearchText(debouncedSearchText)`
  - `useEffect` on `searchText`, `cuisine`, `mealType`, `tags`, `isFavorite`, `maxTotalMinutes`, `sortBy` — rebuild query with `buildRecipeQuery` and call `recipeRepository.listRecipes()` to update displayed list
  - In `grid` view mode, use `numColumns={2}` on the FlatList and render a smaller card (reduce image height, smaller text) — you can pass a `compact` prop to `RecipeCard` or create a `RecipeCardCompact` wrapper
  - `FilterChips` dismiss callbacks call the appropriate `useSearchStore` actions
  - The floating "+" add recipe button remains visible in both modes

  Run `npx tsc --noEmit` and fix any errors.

---

## Task 5 — Load distinct filter values for cuisine and mealType pickers

- [ ] Add a method `getDistinctValues(column: 'cuisine' | 'meal_type'): Promise<string[]>` to `RecipeRepository` in `infra/db/repositories/recipe-repository.ts`:

  ```sql
  SELECT DISTINCT cuisine FROM recipes WHERE deleted_at IS NULL AND cuisine IS NOT NULL ORDER BY cuisine ASC
  ```

  (swap column name for `meal_type` variant).

  Create `features/search/components/FilterSheet.tsx` — a bottom-sheet style panel (use a `Modal` with slide-up animation or a simple absolute-positioned view) that allows the user to select cuisine, mealType, and maxTotalMinutes filters:
  - **Cuisine section:** loads distinct cuisines from `recipeRepository.getDistinctValues('cuisine')` on open; renders as a scrollable list of pressable chips — tapping one calls `store.setCuisine(value)` (or clears if already selected)
  - **Meal type section:** same pattern for `meal_type`
  - **Quick filter section:** preset time buttons — "Under 15 min" (15), "Under 30 min" (30), "Under 60 min" (60), "Any time" (null) — tapping sets `store.setMaxTotalMinutes`
  - **Favourites toggle:** a row with label "Favourites only" and a `rnr` Checkbox wired to `store.setIsFavorite`
  - **Apply / Close button** at bottom

  Add a "Filters" button to both the Search screen and the Recipes screen that opens `FilterSheet`. Show a badge count on the button indicating how many filters are active (count of non-null/non-default filter values).

  Run `npx tsc --noEmit` and fix any errors.

---

## Task 6 — Unit tests for the query builder

- [ ] Create `features/search/__tests__/query-builder.test.ts`. Use Vitest (`describe`/`it`/`expect`). Import `buildRecipeQuery` and `RecipeFilters` from `features/search/query-builder`. No mocking needed — this is a pure function.

  Define a base `emptyFilters: RecipeFilters` with all defaults (`searchText: ''`, `cuisine: null`, `mealType: null`, `tags: []`, `isFavorite: false`, `maxTotalMinutes: null`, `sortBy: 'newest'`).

  Write the following tests:

  **No filters:**
  - `buildRecipeQuery(emptyFilters)` SQL contains `WHERE r.deleted_at IS NULL`
  - SQL contains `ORDER BY r.created_at DESC`
  - SQL contains `LIMIT` and `OFFSET`
  - params array ends with `[100, 0]` (default limit/offset)

  **searchText filter:**
  - Non-empty `searchText` adds `LIKE` clause to SQL
  - params include `%term%` for each of the three search columns
  - Empty/whitespace-only `searchText` does NOT add LIKE clause

  **Individual filters:**
  - `cuisine: 'Italian'` → SQL contains `r.cuisine = ?`, params contain `'Italian'`
  - `mealType: 'Dinner'` → SQL contains `r.meal_type = ?`, params contain `'Dinner'`
  - `isFavorite: true` → SQL contains `r.is_favorite = 1` (no extra param)
  - `isFavorite: false` → SQL does NOT contain `is_favorite`
  - `maxTotalMinutes: 30` → SQL contains `COALESCE` time clause, params contain `30`

  **Tags filter:**
  - Single tag → SQL contains one `search_tags LIKE ?`, params contain `%tagname%`
  - Two tags → SQL contains two separate tag LIKE clauses

  **Sort options (test each):**
  - `newest` → SQL contains `ORDER BY r.created_at DESC`
  - `updated` → SQL contains `ORDER BY r.updated_at DESC`
  - `favorite` → SQL contains `ORDER BY r.is_favorite DESC`
  - `quickest` → SQL contains `COALESCE` in ORDER BY
  - `rated` → SQL contains `ORDER BY r.rating DESC`
  - `lastCooked` → SQL contains `ORDER BY r.last_cooked_at DESC`

  **Combined filters:**
  - searchText + cuisine + isFavorite → all three clauses present in SQL
  - All filters active simultaneously → SQL and params are valid (no duplicate `?` mismatches — verify `params.length` equals the count of `?` in the SQL string)

  Run `npm test` and confirm all new tests pass alongside existing tests.

---

## Human verification steps (do not use checkbox syntax — these require manual action)

- Open the Search tab — confirm it is focused and shows the search input
- Type a recipe title fragment — confirm results appear within ~150ms
- Tap the Filters button — confirm the filter sheet opens
- Select a cuisine — confirm the cuisine chip appears and results filter
- Dismiss the cuisine chip — confirm results reset
- Tap Clear All — confirm all filter chips disappear and full list returns
- Open the Recipes tab — confirm search input is present at top
- Type in the Recipes tab search — confirm results filter in the same list
- Toggle list/grid view — confirm layout changes
- Switch to Search tab — confirm the search text from Recipes tab is NOT carried over (they share filter state but the local input value is independent)
- Run `npm run typecheck` → exits 0
- Run `npm run lint` → exits 0
- Run `npm test` → all tests pass
