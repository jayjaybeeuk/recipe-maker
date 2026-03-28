import * as Crypto from 'expo-crypto'
import { getDb } from '../migration-runner'
import { rowToCollection, rowToRecipe } from '../mappers'
import type { Collection, Recipe } from '../../../shared/types'

export class CollectionRepository {
  async createCollection(name: string, description?: string): Promise<Collection> {
    const db = getDb()
    const id = Crypto.randomUUID()
    const now = new Date().toISOString()

    await db.runAsync(
      `INSERT INTO collections (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      id,
      name,
      description ?? null,
      now,
      now
    )

    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM collections WHERE id = ?`,
      id
    )
    return rowToCollection(row!)
  }

  async listCollections(): Promise<Collection[]> {
    const db = getDb()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM collections ORDER BY created_at DESC`
    )
    return rows.map(rowToCollection)
  }

  async addRecipeToCollection(collectionId: string, recipeId: string): Promise<void> {
    const db = getDb()
    await db.runAsync(
      `INSERT OR IGNORE INTO collection_recipes (collection_id, recipe_id) VALUES (?, ?)`,
      collectionId,
      recipeId
    )
  }

  async removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<void> {
    const db = getDb()
    await db.runAsync(
      `DELETE FROM collection_recipes WHERE collection_id = ? AND recipe_id = ?`,
      collectionId,
      recipeId
    )
  }

  async listRecipesInCollection(collectionId: string): Promise<Recipe[]> {
    const db = getDb()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT r.* FROM recipes r
       INNER JOIN collection_recipes cr ON cr.recipe_id = r.id
       WHERE cr.collection_id = ? AND r.deleted_at IS NULL
       ORDER BY r.created_at DESC`,
      collectionId
    )
    return rows.map(rowToRecipe)
  }

  async deleteCollection(id: string): Promise<void> {
    const db = getDb()
    await db.runAsync(`DELETE FROM collection_recipes WHERE collection_id = ?`, id)
    await db.runAsync(`DELETE FROM collections WHERE id = ?`, id)
  }
}
