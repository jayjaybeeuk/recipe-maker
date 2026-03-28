# Recipes CRUD Implementation

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints. Data model defined in 03-data-model-and-storage.md. Navigation defined in 04-ui-ux-and-navigation.md.

## Goal
Implement reliable local recipe creation, editing, deletion, and viewing backed by SQLite with sync queue integration.

## Domain Interfaces

### RecipeRepository
```typescript
interface RecipeRepository {
  createRecipe(input: CreateRecipeInput): Promise<Recipe>
  updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe>
  deleteRecipe(id: string): Promise<void>           // soft delete
  getRecipeById(id: string): Promise<Recipe | null>
  listRecipes(query: RecipeQuery): Promise<Recipe[]>
  toggleFavorite(id: string, isFavorite: boolean): Promise<void>
}

interface RecipeQuery {
  searchText?: string
  cuisine?: string
  mealType?: string
  tags?: string[]
  isFavorite?: boolean
  maxTotalMinutes?: number
  sortBy?: 'newest' | 'updated' | 'favorite' | 'quickest' | 'rated' | 'lastCooked'
  limit?: number
  offset?: number
}
```

### CreateRecipeInput / UpdateRecipeInput
Include all Recipe scalar fields plus:
- `ingredients: IngredientInput[]`
- `steps: StepInput[]`
- `tags: string[]` (tag names, find-or-create)

## Zod Validation Schema
```typescript
const recipeFormSchema = z.object({
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
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Ingredient name required'),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
    optional: z.boolean().default(false),
  })).min(1, 'At least one ingredient required'),
  steps: z.array(z.object({
    instruction: z.string().min(1, 'Step instruction required'),
    durationMinutes: z.number().int().positive().optional(),
  })).min(1, 'At least one step required'),
  tags: z.array(z.string()),
})
```

## Save Behavior
When saving a recipe (create or update):
1. Validate form with Zod schema
2. Write/update recipe row, computing `searchText` = normalized(title + description + notes)
3. Replace all ingredient rows for this recipeId
4. Replace all step rows for this recipeId
5. Find-or-create tags, reconcile recipe_tags join table
6. Update `searchIngredients` and `searchTags` helper columns on recipe row
7. Enqueue sync mutation in sync_queue
8. Refresh Zustand store slice

## Delete Behavior
- Set `deletedAt` timestamp on recipe row
- Exclude deleted recipes from all default queries (`WHERE deleted_at IS NULL`)
- Enqueue delete mutation for sync
- Navigate back to recipe list on completion

## Favorite Toggle Behavior
- Update `isFavorite` on recipe row
- Update `updatedAt`
- Enqueue update mutation
- Optimistically update Zustand store

## Image Handling
- Use `expo-image-picker` to select from library or camera
- Store local URI reference in `imageUri` field
- Upload to Supabase Storage occurs during sync (phase 5)
- Show local image immediately after pick

## Implementation Tasks
- [ ] Implement `RecipeRepository` in `infra/db/repositories/recipe-repository.ts` with createRecipe, updateRecipe, deleteRecipe (soft), getRecipeById, listRecipes (with search/filter/sort), toggleFavorite — including search helper field population on every write and sync queue enqueue
- [ ] Implement `IngredientRepository.replaceForRecipe` and `StepRepository.replaceForRecipe` in `infra/db/repositories/`
- [ ] Implement `TagRepository.findOrCreate` and `TagRepository.reconcileForRecipe` in `infra/db/repositories/`
- [ ] Create Zustand recipe store slice in `features/recipes/store.ts` with listRecipes state, selectedRecipe state, loading/error states, and actions that call repository methods
- [ ] Build Add Recipe screen using React Hook Form + Zod schema with reorderable ingredient rows (drag handle or up/down buttons), reorderable step rows, tag input with autocomplete from existing tags, image picker with preview, and inline validation messages
- [ ] Build Edit Recipe screen pre-populating form from existing recipe data fetched by id
- [ ] Build delete confirmation flow (modal or action sheet) that soft-deletes and navigates back
- [ ] Add favorite toggle button to Recipe Detail screen and Recipe Card, wired to repository
- [ ] Add unit tests for RecipeRepository (create, update, soft delete, listRecipes with filters, search helper population), TagRepository (findOrCreate, reconcile), and Zod schema validation
