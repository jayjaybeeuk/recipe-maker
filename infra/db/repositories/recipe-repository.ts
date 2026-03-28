import * as Crypto from 'expo-crypto'
import { getDb } from '../migration-runner'
import { rowToRecipe } from '../mappers'
import type { Recipe, CreateRecipeInput, UpdateRecipeInput, RecipeQuery } from '../../../shared/types'
import type { IngredientRepository } from './ingredient-repository'
import type { StepRepository } from './step-repository'
import type { TagRepository } from './tag-repository'
import type { SyncQueueRepository } from './sync-queue-repository'

function buildSortClause(sortBy?: RecipeQuery['sortBy']): string {
  switch (sortBy) {
    case 'newest': return 'ORDER BY created_at DESC'
    case 'updated': return 'ORDER BY updated_at DESC'
    case 'favorite': return 'ORDER BY is_favorite DESC, updated_at DESC'
    case 'quickest': return 'ORDER BY (COALESCE(prep_time_minutes, 0) + COALESCE(cook_time_minutes, 0)) ASC'
    case 'rated': return 'ORDER BY rating DESC'
    case 'lastCooked': return 'ORDER BY last_cooked_at DESC'
    default: return 'ORDER BY created_at DESC'
  }
}

export class RecipeRepository {
  constructor(
    private ingredientRepository: IngredientRepository,
    private stepRepository: StepRepository,
    private tagRepository: TagRepository,
    private syncQueueRepository: SyncQueueRepository
  ) {}

  async createRecipe(input: CreateRecipeInput): Promise<Recipe> {
    const db = getDb()
    const id = Crypto.randomUUID()
    const now = new Date().toISOString()

    const searchText = [input.title, input.description, input.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    await db.runAsync(
      `INSERT INTO recipes (
        id, title, description, prep_time_minutes, cook_time_minutes, servings,
        difficulty, cuisine, meal_type, source_url, notes, rating, is_favorite,
        image_uri, created_at, updated_at, last_cooked_at, deleted_at,
        sync_status, search_text, search_ingredients, search_tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'pending', ?, '', '')`,
      id,
      input.title,
      input.description ?? null,
      input.prepTimeMinutes ?? null,
      input.cookTimeMinutes ?? null,
      input.servings ?? null,
      input.difficulty ?? null,
      input.cuisine ?? null,
      input.mealType ?? null,
      input.sourceUrl ?? null,
      input.notes ?? null,
      input.rating ?? null,
      input.isFavorite ? 1 : 0,
      input.imageUri ?? null,
      now,
      now,
      searchText
    )

    const ingredients = await this.ingredientRepository.replaceForRecipe(id, input.ingredients)
    await this.stepRepository.replaceForRecipe(id, input.steps)
    const tags = await this.tagRepository.reconcileForRecipe(id, input.tags)

    const searchIngredients = ingredients.map(i => i.name).join(' ').toLowerCase()
    const searchTags = tags.map(t => t.name).join(' ').toLowerCase()

    await db.runAsync(
      `UPDATE recipes SET search_ingredients = ?, search_tags = ? WHERE id = ?`,
      searchIngredients,
      searchTags,
      id
    )

    await this.syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'create',
      payload: JSON.stringify({ ...input, id }),
    })

    const recipe = await this.getRecipeById(id)
    return recipe!
  }

  async updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    const db = getDb()
    const now = new Date().toISOString()

    const existing = await this.getRecipeById(id)
    if (!existing) throw new Error(`Recipe ${id} not found`)

    const merged = { ...existing, ...input }
    const searchText = [merged.title, merged.description, merged.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    await db.runAsync(
      `UPDATE recipes SET
        title = ?, description = ?, prep_time_minutes = ?, cook_time_minutes = ?,
        servings = ?, difficulty = ?, cuisine = ?, meal_type = ?, source_url = ?,
        notes = ?, rating = ?, is_favorite = ?, image_uri = ?,
        updated_at = ?, sync_status = 'pending', search_text = ?
       WHERE id = ?`,
      merged.title,
      merged.description ?? null,
      merged.prepTimeMinutes ?? null,
      merged.cookTimeMinutes ?? null,
      merged.servings ?? null,
      merged.difficulty ?? null,
      merged.cuisine ?? null,
      merged.mealType ?? null,
      merged.sourceUrl ?? null,
      merged.notes ?? null,
      merged.rating ?? null,
      merged.isFavorite ? 1 : 0,
      merged.imageUri ?? null,
      now,
      searchText,
      id
    )

    let searchIngredients = existing.searchIngredients
    let searchTags = existing.searchTags

    if (input.ingredients !== undefined) {
      const ingredients = await this.ingredientRepository.replaceForRecipe(id, input.ingredients)
      searchIngredients = ingredients.map(i => i.name).join(' ').toLowerCase()
    }

    if (input.steps !== undefined) {
      await this.stepRepository.replaceForRecipe(id, input.steps)
    }

    if (input.tags !== undefined) {
      const tags = await this.tagRepository.reconcileForRecipe(id, input.tags)
      searchTags = tags.map(t => t.name).join(' ').toLowerCase()
    }

    await db.runAsync(
      `UPDATE recipes SET search_ingredients = ?, search_tags = ? WHERE id = ?`,
      searchIngredients,
      searchTags,
      id
    )

    await this.syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'update',
      payload: JSON.stringify({ id, ...input }),
    })

    const recipe = await this.getRecipeById(id)
    return recipe!
  }

  async deleteRecipe(id: string): Promise<void> {
    const db = getDb()
    const now = new Date().toISOString()

    await db.runAsync(
      `UPDATE recipes SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      now,
      now,
      id
    )

    await this.syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'delete',
      payload: JSON.stringify({ id }),
    })
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    const db = getDb()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL`,
      id
    )
    return row ? rowToRecipe(row) : null
  }

  async listRecipes(query: RecipeQuery): Promise<Recipe[]> {
    const db = getDb()
    const conditions: string[] = ['deleted_at IS NULL']
    const params: (string | number | null)[] = []

    if (query.searchText) {
      const term = `%${query.searchText}%`
      conditions.push('(search_text LIKE ? OR search_ingredients LIKE ? OR search_tags LIKE ?)')
      params.push(term, term, term)
    }

    if (query.cuisine) {
      conditions.push('cuisine = ?')
      params.push(query.cuisine)
    }

    if (query.mealType) {
      conditions.push('meal_type = ?')
      params.push(query.mealType)
    }

    if (query.isFavorite !== undefined) {
      conditions.push('is_favorite = ?')
      params.push(query.isFavorite ? 1 : 0)
    }

    if (query.maxTotalMinutes !== undefined) {
      conditions.push('(COALESCE(prep_time_minutes, 0) + COALESCE(cook_time_minutes, 0)) <= ?')
      params.push(query.maxTotalMinutes)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sort = buildSortClause(query.sortBy)
    const limit = query.limit ?? 100
    const offset = query.offset ?? 0

    const sql = `SELECT * FROM recipes ${where} ${sort} LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const rows = await db.getAllAsync<Record<string, unknown>>(sql, ...params)
    return rows.map(rowToRecipe)
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const db = getDb()
    const now = new Date().toISOString()

    await db.runAsync(
      `UPDATE recipes SET is_favorite = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      isFavorite ? 1 : 0,
      now,
      id
    )

    await this.syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'update',
      payload: JSON.stringify({ id, isFavorite }),
    })
  }
}
