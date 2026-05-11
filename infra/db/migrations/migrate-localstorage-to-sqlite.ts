import { Platform } from 'react-native'
import { getDb } from '../migration-runner'

const LS_KEYS = {
  recipes: 'recipe-maker:recipes',
  ingredients: 'recipe-maker:ingredients',
  steps: 'recipe-maker:steps',
  tags: 'recipe-maker:tags',
  recipeTags: 'recipe-maker:recipe-tags',
  collections: 'recipe-maker:collections',
  collectionRecipes: 'recipe-maker:collection-recipes',
  syncQueue: 'recipe-maker:sync-queue',
  cookingSessions: 'recipe-maker:cooking-sessions',
} as const

const MIGRATED_KEY = 'recipe-maker:migrated'

function loadJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function migrateLocalStorageToSqlite(): Promise<void> {
  if (Platform.OS !== 'web') return
  if (typeof localStorage === 'undefined') return
  if (!localStorage.getItem(LS_KEYS.recipes)) return
  if (localStorage.getItem(MIGRATED_KEY) === 'true') return

  const db = getDb()

  // --- Recipes ---
  const recipes = loadJson<Record<string, unknown>>(LS_KEYS.recipes)
  for (const r of recipes) {
    await db.runAsync(
      `INSERT OR IGNORE INTO recipes (id, title, description, prep_time_minutes, cook_time_minutes, servings, difficulty, cuisine, meal_type, source_url, notes, rating, is_favorite, image_uri, created_at, updated_at, last_cooked_at, deleted_at, sync_status, search_text, search_ingredients, search_tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      r.id as string,
      r.title as string,
      (r.description as string) ?? null,
      (r.prepTimeMinutes as number) ?? null,
      (r.cookTimeMinutes as number) ?? null,
      (r.servings as number) ?? null,
      (r.difficulty as string) ?? null,
      (r.cuisine as string) ?? null,
      (r.mealType as string) ?? null,
      (r.sourceUrl as string) ?? null,
      (r.notes as string) ?? null,
      (r.rating as number) ?? null,
      r.isFavorite ? 1 : 0,
      (r.imageUri as string) ?? null,
      r.createdAt as string,
      r.updatedAt as string,
      (r.lastCookedAt as string) ?? null,
      (r.deletedAt as string) ?? null,
      (r.syncStatus as string) ?? 'pending',
      (r.searchText as string) ?? '',
      (r.searchIngredients as string) ?? '',
      (r.searchTags as string) ?? ''
    )
  }

  // --- Ingredients ---
  const ingredients = loadJson<Record<string, unknown>>(LS_KEYS.ingredients)
  for (const i of ingredients) {
    await db.runAsync(
      `INSERT OR IGNORE INTO ingredients (id, recipe_id, name, quantity, unit, optional, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      i.id as string,
      i.recipeId as string,
      i.name as string,
      (i.quantity as number) ?? null,
      (i.unit as string) ?? null,
      i.optional ? 1 : 0,
      (i.sortOrder as number) ?? 0
    )
  }

  // --- Steps ---
  const steps = loadJson<Record<string, unknown>>(LS_KEYS.steps)
  for (const s of steps) {
    await db.runAsync(
      `INSERT OR IGNORE INTO steps (id, recipe_id, instruction, duration_minutes, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      s.id as string,
      s.recipeId as string,
      s.instruction as string,
      (s.durationMinutes as number) ?? null,
      (s.sortOrder as number) ?? 0
    )
  }

  // --- Tags ---
  const tags = loadJson<Record<string, unknown>>(LS_KEYS.tags)
  for (const t of tags) {
    await db.runAsync(
      `INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`,
      t.id as string,
      t.name as string
    )
  }

  // --- Recipe Tags ---
  const recipeTags = loadJson<Record<string, unknown>>(LS_KEYS.recipeTags)
  for (const rt of recipeTags) {
    await db.runAsync(
      `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`,
      rt.recipeId as string,
      rt.tagId as string
    )
  }

  // --- Collections ---
  const collections = loadJson<Record<string, unknown>>(LS_KEYS.collections)
  for (const c of collections) {
    await db.runAsync(
      `INSERT OR IGNORE INTO collections (id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      c.id as string,
      c.name as string,
      (c.description as string) ?? null,
      c.createdAt as string,
      c.updatedAt as string
    )
  }

  // --- Collection Recipes ---
  const collectionRecipes = loadJson<Record<string, unknown>>(LS_KEYS.collectionRecipes)
  for (const cr of collectionRecipes) {
    await db.runAsync(
      `INSERT OR IGNORE INTO collection_recipes (collection_id, recipe_id) VALUES (?, ?)`,
      cr.collectionId as string,
      cr.recipeId as string
    )
  }

  // --- Sync Queue ---
  const syncQueue = loadJson<Record<string, unknown>>(LS_KEYS.syncQueue)
  for (const sq of syncQueue) {
    await db.runAsync(
      `INSERT OR IGNORE INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at, retry_count, last_error, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      sq.id as string,
      sq.entityType as string,
      sq.entityId as string,
      sq.operation as string,
      sq.payload as string,
      sq.createdAt as string,
      (sq.retryCount as number) ?? 0,
      (sq.lastError as string) ?? null,
      (sq.status as string) ?? 'pending'
    )
  }

  // --- Cooking Sessions ---
  const sessions = loadJson<Record<string, unknown>>(LS_KEYS.cookingSessions)
  for (const s of sessions) {
    await db.runAsync(
      `INSERT OR IGNORE INTO active_cooking_sessions (id, recipe_id, servings_override, checked_ingredient_ids, checked_step_ids, started_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      s.id as string,
      s.recipeId as string,
      (s.servingsOverride as number) ?? null,
      JSON.stringify((s.checkedIngredientIds as string[]) ?? []),
      JSON.stringify((s.checkedStepIds as string[]) ?? []),
      s.startedAt as string,
      s.updatedAt as string,
      (s.completedAt as string) ?? null
    )
  }

  // Mark migration complete and clear old data
  localStorage.setItem(MIGRATED_KEY, 'true')
  for (const key of Object.values(LS_KEYS)) {
    localStorage.removeItem(key)
  }
}
