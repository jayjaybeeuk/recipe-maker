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

export interface SyncQueueEntry {
  id: string
  entityType: 'recipe' | 'ingredient' | 'step' | 'tag' | 'collection'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: string
  createdAt: string
  retryCount: number
  lastError: string | null
  status: 'pending' | 'failed'
}

export * from './schemas'
export type { RecipeFilters } from '../../features/search/query-builder'
