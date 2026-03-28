import type { Recipe, Ingredient, Step, Tag, Collection, SyncQueueEntry } from '../../shared/types'

export function rowToRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    prepTimeMinutes: (row.prep_time_minutes as number | null) ?? null,
    cookTimeMinutes: (row.cook_time_minutes as number | null) ?? null,
    servings: (row.servings as number | null) ?? null,
    difficulty: (row.difficulty as Recipe['difficulty']) ?? null,
    cuisine: (row.cuisine as string | null) ?? null,
    mealType: (row.meal_type as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    rating: (row.rating as number | null) ?? null,
    isFavorite: row.is_favorite === 1 || row.is_favorite === true,
    imageUri: (row.image_uri as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastCookedAt: (row.last_cooked_at as string | null) ?? null,
    deletedAt: (row.deleted_at as string | null) ?? null,
    syncStatus: row.sync_status as Recipe['syncStatus'],
    searchText: (row.search_text as string) ?? '',
    searchIngredients: (row.search_ingredients as string) ?? '',
    searchTags: (row.search_tags as string) ?? '',
  }
}

export function rowToIngredient(row: Record<string, unknown>): Ingredient {
  return {
    id: row.id as string,
    recipeId: row.recipe_id as string,
    name: row.name as string,
    quantity: (row.quantity as number | null) ?? null,
    unit: (row.unit as string | null) ?? null,
    optional: row.optional === 1 || row.optional === true,
    sortOrder: row.sort_order as number,
  }
}

export function rowToStep(row: Record<string, unknown>): Step {
  return {
    id: row.id as string,
    recipeId: row.recipe_id as string,
    instruction: row.instruction as string,
    durationMinutes: (row.duration_minutes as number | null) ?? null,
    sortOrder: row.sort_order as number,
  }
}

export function rowToTag(row: Record<string, unknown>): Tag {
  return {
    id: row.id as string,
    name: row.name as string,
  }
}

export function rowToCollection(row: Record<string, unknown>): Collection {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function rowToSyncQueueEntry(row: Record<string, unknown>): SyncQueueEntry {
  return {
    id: row.id as string,
    entityType: row.entity_type as SyncQueueEntry['entityType'],
    entityId: row.entity_id as string,
    operation: row.operation as SyncQueueEntry['operation'],
    payload: row.payload as string,
    createdAt: row.created_at as string,
    retryCount: row.retry_count as number,
    lastError: (row.last_error as string | null) ?? null,
    status: row.status as SyncQueueEntry['status'],
  }
}
