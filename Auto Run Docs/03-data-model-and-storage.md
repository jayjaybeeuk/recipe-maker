# Data Model and Storage

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints.

## Entities

### Recipe
```typescript
interface Recipe {
  id: string                    // uuid
  title: string
  description: string | null
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  cuisine: string | null
  mealType: string | null
  sourceUrl: string | null
  notes: string | null
  rating: number | null         // 1-5
  isFavorite: boolean
  imageUri: string | null
  createdAt: string             // ISO-8601 UTC
  updatedAt: string             // ISO-8601 UTC
  lastCookedAt: string | null   // ISO-8601 UTC
  deletedAt: string | null      // soft delete
  syncStatus: 'pending' | 'synced' | 'failed'
  // Search helper columns
  searchText: string            // normalized title + description + notes
  searchIngredients: string     // materialized ingredient names
  searchTags: string            // materialized tag names
}
```

### Ingredient
```typescript
interface Ingredient {
  id: string      // uuid
  recipeId: string
  name: string
  quantity: number | null
  unit: string | null
  optional: boolean
  sortOrder: number
}
```

### Step
```typescript
interface Step {
  id: string      // uuid
  recipeId: string
  instruction: string
  durationMinutes: number | null
  sortOrder: number
}
```

### Tag
```typescript
interface Tag {
  id: string      // uuid
  name: string
}
```

### RecipeTag
```typescript
interface RecipeTag {
  recipeId: string
  tagId: string
}
```

### Collection
```typescript
interface Collection {
  id: string      // uuid
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}
```

### CollectionRecipe
```typescript
interface CollectionRecipe {
  collectionId: string
  recipeId: string
}
```

### ActiveCookingSession
```typescript
interface ActiveCookingSession {
  id: string      // uuid
  recipeId: string
  servingsOverride: number | null
  checkedIngredientIds: string    // JSON array stored as text
  checkedStepIds: string          // JSON array stored as text
  startedAt: string
  updatedAt: string
  completedAt: string | null
}
```

### SyncQueue
```typescript
interface SyncQueueEntry {
  id: string
  entityType: 'recipe' | 'ingredient' | 'step' | 'tag' | 'collection'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: string     // JSON
  createdAt: string
  retryCount: number
  lastError: string | null
  status: 'pending' | 'processing' | 'failed'
}
```

## SQLite Tables
- `recipes`
- `ingredients`
- `steps`
- `tags`
- `recipe_tags`
- `collections`
- `collection_recipes`
- `active_cooking_sessions`
- `sync_queue`

## Search Index Strategy
Use SQLite queries with normalized search helper fields rather than external search infrastructure.

Indexed columns on `recipes`:
- `search_text` — normalized lowercase title + description + notes
- `search_ingredients` — materialized string of ingredient names
- `search_tags` — materialized string of tag names
- `cuisine` (index)
- `meal_type` (index)
- `is_favorite` (index)
- `created_at` (index)
- `last_cooked_at` (index)

## Conflict Strategy
- Last-write-wins for scalar fields in MVP
- Ingredients, steps, and tags replaced as full sets on save
- Soft deletes via `deletedAt` / `deleted_at`
- Future: merge-aware sync with vector clocks

## Schema Rules
- Timestamps stored as ISO-8601 UTC strings
- All IDs are UUIDs (generated client-side)
- Foreign key constraints enforced
- Sort order maintained by `sort_order` integer

## Implementation Tasks
- [ ] Define all TypeScript interfaces in `shared/types/` for Recipe, Ingredient, Step, Tag, Collection, ActiveCookingSession, SyncQueueEntry
- [ ] Write Zod schemas in `shared/types/` matching each interface for runtime validation
- [ ] Create SQLite migration 001 in `infra/db/migrations/` defining all tables with correct columns, types, foreign keys, and indexes
- [ ] Implement migration runner in `infra/db/` that applies pending migrations on app start
- [ ] Write repository class `RecipeRepository` in `infra/db/` with methods: createRecipe, updateRecipe, deleteRecipe (soft), getRecipeById, listRecipes, toggleFavorite — including search helper field population on write
- [ ] Write repository class `IngredientRepository` with methods: replaceForRecipe, listByRecipeId
- [ ] Write repository class `StepRepository` with methods: replaceForRecipe, listByRecipeId
- [ ] Write repository class `TagRepository` with methods: findOrCreate, reconcileForRecipe, listByRecipeId
- [ ] Write repository class `CollectionRepository` with CRUD and listRecipesInCollection
- [ ] Write repository class `CookingSessionRepository` with createOrResume, update, complete, getActiveForRecipe
- [ ] Write repository class `SyncQueueRepository` with enqueue, dequeue, markFailed
- [ ] Add unit tests for migration runner, RecipeRepository, search helper population, and soft delete behavior
