import * as Crypto from 'expo-crypto'
import { getDb } from '../migration-runner'
import { rowToIngredient } from '../mappers'
import type { Ingredient, IngredientInput } from '../../../shared/types'

export class IngredientRepository {
  async replaceForRecipe(recipeId: string, ingredients: IngredientInput[]): Promise<Ingredient[]> {
    const db = getDb()
    await db.runAsync(`DELETE FROM ingredients WHERE recipe_id = ?`, recipeId)

    const result: Ingredient[] = []
    for (let i = 0; i < ingredients.length; i++) {
      const input = ingredients[i]
      const id = Crypto.randomUUID()
      await db.runAsync(
        `INSERT INTO ingredients (id, recipe_id, name, quantity, unit, optional, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        recipeId,
        input.name,
        input.quantity ?? null,
        input.unit ?? null,
        input.optional ? 1 : 0,
        i
      )
      result.push({ id, recipeId, name: input.name, quantity: input.quantity ?? null, unit: input.unit ?? null, optional: input.optional, sortOrder: i })
    }
    return result
  }

  async listByRecipeId(recipeId: string): Promise<Ingredient[]> {
    const db = getDb()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order ASC`,
      recipeId
    )
    return rows.map(rowToIngredient)
  }
}
