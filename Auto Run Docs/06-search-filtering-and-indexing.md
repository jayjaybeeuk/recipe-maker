# Search, Filtering, and Indexing

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints. Data model in 03-data-model-and-storage.md. CRUD in 05-recipes-crud.md.

## Goal
Provide fast, intuitive local recipe discovery with sub-150ms responsiveness for up to 5,000 recipes.

## Search Inputs

| Input | Behavior |
|-------|----------|
| Free text | Match against searchText, searchIngredients, searchTags |
| Cuisine filter | Exact match on cuisine column |
| Meal type filter | Exact match on mealType column |
| Tag filter | Match against searchTags or JOIN recipe_tags |
| Favorite filter | WHERE is_favorite = 1 |
| Quick filter | WHERE (prep_time_minutes + cook_time_minutes) <= threshold |

## Sort Options

| Key | SQL ORDER BY |
|-----|-------------|
| newest | created_at DESC |
| updated | updated_at DESC |
| favorite | is_favorite DESC, created_at DESC |
| quickest | (prep_time_minutes + cook_time_minutes) ASC NULLS LAST |
| rated | rating DESC NULLS LAST |
| lastCooked | last_cooked_at DESC NULLS LAST |

## Search UX
- Debounced input: 150ms delay before query fires
- Show active filter chips below search bar, each dismissible
- "Clear all" action removes all active filters
- Empty state: show guidance when no results match
- Recent searches: persist last 10 search terms in AsyncStorage or SQLite preferences table

## Query Strategy
Build a single SQLite query from active filter state:
```sql
SELECT r.*
FROM recipes r
WHERE r.deleted_at IS NULL
  AND (r.search_text LIKE ? OR r.search_ingredients LIKE ? OR r.search_tags LIKE ?)  -- if searchText
  AND r.cuisine = ?           -- if cuisine filter active
  AND r.meal_type = ?         -- if mealType filter active
  AND r.is_favorite = 1       -- if favorite filter active
  AND (r.prep_time_minutes + r.cook_time_minutes) <= ?  -- if quick filter active
ORDER BY ...
LIMIT ? OFFSET ?
```
Use parameterized queries. No string concatenation of user input.

## Filter State Model
```typescript
interface RecipeFilters {
  searchText: string
  cuisine: string | null
  mealType: string | null
  tags: string[]
  isFavorite: boolean
  maxTotalMinutes: number | null
  sortBy: 'newest' | 'updated' | 'favorite' | 'quickest' | 'rated' | 'lastCooked'
}
```

## Available Filter Values
Derive cuisine and mealType filter options dynamically from distinct values in the recipes table to keep filters relevant to what the user has actually entered.

## SQLite Indexes
Ensure indexes exist on:
- `recipes(deleted_at)` — all queries filter this
- `recipes(is_favorite)`
- `recipes(cuisine)`
- `recipes(meal_type)`
- `recipes(created_at)`
- `recipes(updated_at)`
- `recipes(last_cooked_at)`
- `recipes(prep_time_minutes, cook_time_minutes)` — composite for quickest sort

The `search_text`, `search_ingredients`, `search_tags` columns use LIKE queries — no FTS extension needed for MVP.

## Implementation Tasks
- [ ] Implement `buildRecipeQuery(filters: RecipeFilters)` utility in `features/search/query-builder.ts` that produces a parameterized SQLite query string and params array from a RecipeFilters object — covering all filter combinations and sort options
- [ ] Add `RecipeFilters` type and initial state to `features/search/store.ts` Zustand slice, with actions for setSearchText (debounced 150ms), setCuisine, setMealType, toggleTag, toggleFavorite, setMaxTotalMinutes, setSortBy, clearAll
- [ ] Build search input component in `features/search/components/SearchInput.tsx` with debounce hook, clear button, and focus management
- [ ] Build filter chips row component in `features/search/components/FilterChips.tsx` rendering active filters as dismissible chips with a clear-all button
- [ ] Build sort selector component in `features/search/components/SortSelector.tsx` as a bottom sheet or dropdown with all sort options
- [ ] Add recent search persistence: save last 10 unique search terms to AsyncStorage on search submit, display as tappable suggestions when input is focused and empty, allow individual and bulk deletion
- [ ] Wire Search screen to use filter store and query builder, passing results to the shared RecipeCard list
- [ ] Wire Recipes screen search bar and filter chips to the same filter store
- [ ] Add unit tests for buildRecipeQuery covering: text search, cuisine filter, mealType filter, tag filter, favorite filter, quick filter, all sort options, combined filters, empty filter state
