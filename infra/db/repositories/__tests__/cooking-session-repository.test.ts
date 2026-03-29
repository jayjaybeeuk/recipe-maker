import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('mock-session-uuid'),
}))

vi.mock('../../migration-runner', () => ({
  getDb: vi.fn(),
}))

import { CookingSessionRepository } from '../cooking-session-repository'
import { getDb } from '../../migration-runner'

const MOCK_SESSION_ROW = {
  id: 'mock-session-uuid',
  recipe_id: 'recipe-1',
  servings_override: null,
  checked_ingredient_ids: '[]',
  checked_step_ids: '[]',
  started_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  completed_at: null,
}

describe('CookingSessionRepository', () => {
  let mockDb: {
    runAsync: Mock
    getFirstAsync: Mock
    getAllAsync: Mock
  }
  let repo: CookingSessionRepository

  beforeEach(() => {
    mockDb = {
      runAsync: vi.fn().mockResolvedValue(undefined),
      getFirstAsync: vi.fn().mockResolvedValue(null),
      getAllAsync: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(getDb).mockReturnValue(mockDb as any)
    repo = new CookingSessionRepository()
  })

  describe('createOrResume', () => {
    it('creates new session with empty checklist arrays when no existing session', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null)

      const session = await repo.createOrResume('recipe-1')

      const insertCall = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO active_cooking_sessions')
      )
      expect(insertCall).toBeDefined()

      expect(session.id).toBe('mock-session-uuid')
      expect(session.recipeId).toBe('recipe-1')
      expect(session.checkedIngredientIds).toEqual([])
      expect(session.checkedStepIds).toEqual([])
      expect(session.completedAt).toBeNull()
    })

    it('returns existing session without inserting when incomplete session exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        ...MOCK_SESSION_ROW,
        checked_ingredient_ids: '["ing-1"]',
        checked_step_ids: '["step-1"]',
      })

      const session = await repo.createOrResume('recipe-1')

      expect(mockDb.runAsync).not.toHaveBeenCalled()
      expect(session.id).toBe('mock-session-uuid')
      expect(session.checkedIngredientIds).toEqual(['ing-1'])
      expect(session.checkedStepIds).toEqual(['step-1'])
    })
  })

  describe('updateChecklist', () => {
    it('serialises arrays as JSON in DB update call', async () => {
      await repo.updateChecklist('session-1', ['ing-1', 'ing-2'], ['step-1'])

      const updateCall = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('UPDATE active_cooking_sessions SET checked_ingredient_ids')
      )
      expect(updateCall).toBeDefined()
      expect(updateCall![1]).toBe('["ing-1","ing-2"]')
      expect(updateCall![2]).toBe('["step-1"]')
    })
  })

  describe('complete', () => {
    it('sets completed_at and updates recipes.last_cooked_at', async () => {
      await repo.complete('session-1', 'recipe-1')

      const sessionUpdate = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('UPDATE active_cooking_sessions SET completed_at')
      )
      expect(sessionUpdate).toBeDefined()

      const recipeUpdate = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('UPDATE recipes SET last_cooked_at')
      )
      expect(recipeUpdate).toBeDefined()
      expect(recipeUpdate![3]).toBe('recipe-1')
    })
  })

  describe('getActiveForRecipe', () => {
    it('returns null when no active session exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null)

      const result = await repo.getActiveForRecipe('recipe-1')

      expect(result).toBeNull()
    })

    it('returns session when incomplete session exists', async () => {
      mockDb.getFirstAsync.mockResolvedValue(MOCK_SESSION_ROW)

      const result = await repo.getActiveForRecipe('recipe-1')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('mock-session-uuid')
      expect(result!.recipeId).toBe('recipe-1')
      expect(result!.checkedIngredientIds).toEqual([])
      expect(result!.checkedStepIds).toEqual([])
    })
  })
})
