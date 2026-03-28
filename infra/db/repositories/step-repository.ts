import * as Crypto from 'expo-crypto'
import { getDb } from '../migration-runner'
import { rowToStep } from '../mappers'
import type { Step, StepInput } from '../../../shared/types'

export class StepRepository {
  async replaceForRecipe(recipeId: string, steps: StepInput[]): Promise<Step[]> {
    const db = getDb()
    await db.runAsync(`DELETE FROM steps WHERE recipe_id = ?`, recipeId)

    const result: Step[] = []
    for (let i = 0; i < steps.length; i++) {
      const input = steps[i]
      const id = Crypto.randomUUID()
      await db.runAsync(
        `INSERT INTO steps (id, recipe_id, instruction, duration_minutes, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        id,
        recipeId,
        input.instruction,
        input.durationMinutes ?? null,
        i
      )
      result.push({ id, recipeId, instruction: input.instruction, durationMinutes: input.durationMinutes ?? null, sortOrder: i })
    }
    return result
  }

  async listByRecipeId(recipeId: string): Promise<Step[]> {
    const db = getDb()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM steps WHERE recipe_id = ? ORDER BY sort_order ASC`,
      recipeId
    )
    return rows.map(rowToStep)
  }
}
