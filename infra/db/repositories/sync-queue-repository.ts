import * as Crypto from 'expo-crypto'
import { getDb } from '../migration-runner'
import { rowToSyncQueueEntry } from '../mappers'
import type { SyncQueueEntry } from '../../../shared/types'

export class SyncQueueRepository {
  async enqueue(
    entry: Omit<SyncQueueEntry, 'id' | 'createdAt' | 'retryCount' | 'lastError' | 'status'>
  ): Promise<void> {
    const db = getDb()
    const id = Crypto.randomUUID()
    const createdAt = new Date().toISOString()

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, created_at, retry_count, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'pending')`,
      id,
      entry.entityType,
      entry.entityId,
      entry.operation,
      entry.payload
    , createdAt)
  }

  async dequeuePending(): Promise<SyncQueueEntry[]> {
    const db = getDb()
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC`
    )
    return rows.map(rowToSyncQueueEntry)
  }

  async markFailed(id: string, error: string): Promise<void> {
    const db = getDb()
    await db.runAsync(
      `UPDATE sync_queue SET status = 'failed', last_error = ?, retry_count = retry_count + 1 WHERE id = ?`,
      error,
      id
    )
  }

  async clearEntry(id: string): Promise<void> {
    const db = getDb()
    await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, id)
  }
}
