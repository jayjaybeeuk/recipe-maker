import * as Crypto from 'expo-crypto'
import { getDb } from '../migration-runner'
import type { ActiveCookingSession } from '../../../shared/types'

function rowToSession(row: Record<string, unknown>): ActiveCookingSession {
  return {
    id: row.id as string,
    recipeId: row.recipe_id as string,
    servingsOverride: row.servings_override as number | null,
    checkedIngredientIds: JSON.parse((row.checked_ingredient_ids as string) ?? '[]') as string[],
    checkedStepIds: JSON.parse((row.checked_step_ids as string) ?? '[]') as string[],
    startedAt: row.started_at as string,
    updatedAt: row.updated_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  }
}

export class CookingSessionRepository {
  async createOrResume(recipeId: string, servingsOverride?: number): Promise<ActiveCookingSession> {
    const db = getDb()

    const existing = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM active_cooking_sessions WHERE recipe_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1`,
      recipeId
    )

    if (existing) {
      return rowToSession(existing)
    }

    const id = Crypto.randomUUID()
    const now = new Date().toISOString()

    await db.runAsync(
      `INSERT INTO active_cooking_sessions (id, recipe_id, servings_override, checked_ingredient_ids, checked_step_ids, started_at, updated_at, completed_at)
       VALUES (?, ?, ?, '[]', '[]', ?, ?, NULL)`,
      id,
      recipeId,
      servingsOverride ?? null,
      now,
      now
    )

    return {
      id,
      recipeId,
      servingsOverride: servingsOverride ?? null,
      checkedIngredientIds: [],
      checkedStepIds: [],
      startedAt: now,
      updatedAt: now,
      completedAt: null,
    }
  }

  async updateChecklist(
    sessionId: string,
    checkedIngredientIds: string[],
    checkedStepIds: string[]
  ): Promise<void> {
    const db = getDb()
    const now = new Date().toISOString()

    await db.runAsync(
      `UPDATE active_cooking_sessions SET checked_ingredient_ids = ?, checked_step_ids = ?, updated_at = ? WHERE id = ?`,
      JSON.stringify(checkedIngredientIds),
      JSON.stringify(checkedStepIds),
      now,
      sessionId
    )
  }

  async updateServings(sessionId: string, servingsOverride: number): Promise<void> {
    const db = getDb()
    const now = new Date().toISOString()

    await db.runAsync(
      `UPDATE active_cooking_sessions SET servings_override = ?, updated_at = ? WHERE id = ?`,
      servingsOverride,
      now,
      sessionId
    )
  }

  async complete(sessionId: string, recipeId: string): Promise<void> {
    const db = getDb()
    const now = new Date().toISOString()

    await db.runAsync(
      `UPDATE active_cooking_sessions SET completed_at = ?, updated_at = ? WHERE id = ?`,
      now,
      now,
      sessionId
    )

    await db.runAsync(
      `UPDATE recipes SET last_cooked_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      now,
      now,
      recipeId
    )

    const syncId = Crypto.randomUUID()
    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at, retry_count, status)
       VALUES (?, 'recipe', ?, 'update', ?, ?, 0, 'pending')`,
      syncId,
      recipeId,
      JSON.stringify({ id: recipeId, lastCookedAt: now }),
      now
    )
  }

  async getActiveForRecipe(recipeId: string): Promise<ActiveCookingSession | null> {
    const db = getDb()

    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM active_cooking_sessions WHERE recipe_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1`,
      recipeId
    )

    return row ? rowToSession(row) : null
  }
}
