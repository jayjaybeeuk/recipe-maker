import * as Crypto from 'expo-crypto'
import { getDb } from '../migration-runner'
import { rowToTag } from '../mappers'
import type { Tag } from '../../../shared/types'

export class TagRepository {
  async findOrCreate(name: string): Promise<Tag> {
    const db = getDb()
    const normalized = name.trim().toLowerCase()

    await db.runAsync(`INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`, Crypto.randomUUID(), normalized)

    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM tags WHERE name = ?`,
      normalized
    )
    return rowToTag(row!)
  }

  async reconcileForRecipe(recipeId: string, tagNames: string[]): Promise<Tag[]> {
    const db = getDb()
    const tags: Tag[] = []

    for (const name of tagNames) {
      const tag = await this.findOrCreate(name)
      tags.push(tag)
    }

    await db.runAsync(`DELETE FROM recipe_tags WHERE recipe_id = ?`, recipeId)

    for (const tag of tags) {
      await db.runAsync(
        `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)`,
        recipeId,
        tag.id
      )
    }

    return tags
  }

  async listByRecipeId(recipeId: string): Promise<Tag[]> {
    const db = getDb()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT t.* FROM tags t
       INNER JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?`,
      recipeId
    )
    return rows.map(rowToTag)
  }
}
