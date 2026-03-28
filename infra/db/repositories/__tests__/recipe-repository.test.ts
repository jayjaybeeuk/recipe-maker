import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('expo-crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('mock-uuid'),
}))

vi.mock('../../migration-runner', () => ({
  getDb: vi.fn(),
}))

import { RecipeRepository } from '../recipe-repository'
import { getDb } from '../../migration-runner'

const MOCK_RECIPE_ROW = {
  id: 'mock-uuid',
  title: 'Test Recipe',
  description: null,
  prep_time_minutes: null,
  cook_time_minutes: null,
  servings: null,
  difficulty: null,
  cuisine: null,
  meal_type: null,
  source_url: null,
  notes: null,
  rating: null,
  is_favorite: 0,
  image_uri: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  last_cooked_at: null,
  deleted_at: null,
  sync_status: 'pending',
  search_text: 'test recipe',
  search_ingredients: '',
  search_tags: '',
}

describe('RecipeRepository', () => {
  let mockDb: {
    runAsync: Mock
    getFirstAsync: Mock
    getAllAsync: Mock
  }
  let mockIngredientRepo: { replaceForRecipe: Mock; listByRecipeId: Mock }
  let mockStepRepo: { replaceForRecipe: Mock; listByRecipeId: Mock }
  let mockTagRepo: { reconcileForRecipe: Mock; listByRecipeId: Mock }
  let mockSyncQueueRepo: { enqueue: Mock }
  let repo: RecipeRepository

  beforeEach(() => {
    mockDb = {
      runAsync: vi.fn().mockResolvedValue(undefined),
      getFirstAsync: vi.fn().mockResolvedValue(MOCK_RECIPE_ROW),
      getAllAsync: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(getDb).mockReturnValue(mockDb as any)

    mockIngredientRepo = {
      replaceForRecipe: vi.fn().mockResolvedValue([{ id: 'ing-1', recipeId: 'mock-uuid', name: 'flour', quantity: 1, unit: 'cup', optional: false, sortOrder: 0 }]),
      listByRecipeId: vi.fn().mockResolvedValue([]),
    }
    mockStepRepo = {
      replaceForRecipe: vi.fn().mockResolvedValue([]),
      listByRecipeId: vi.fn().mockResolvedValue([]),
    }
    mockTagRepo = {
      reconcileForRecipe: vi.fn().mockResolvedValue([]),
      listByRecipeId: vi.fn().mockResolvedValue([]),
    }
    mockSyncQueueRepo = {
      enqueue: vi.fn().mockResolvedValue(undefined),
    }

    repo = new RecipeRepository(
      mockIngredientRepo as any,
      mockStepRepo as any,
      mockTagRepo as any,
      mockSyncQueueRepo as any
    )
  })

  describe('createRecipe', () => {
    it('inserts recipe row and enqueues sync entry', async () => {
      const input = {
        title: 'Test Recipe',
        ingredients: [{ name: 'flour', quantity: 1, unit: 'cup', optional: false }],
        steps: [{ instruction: 'Mix flour', durationMinutes: null }],
        tags: [],
      }

      const recipe = await repo.createRecipe(input)

      // Should call runAsync with INSERT INTO recipes
      const insertCall = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO recipes')
      )
      expect(insertCall).toBeDefined()
      expect(insertCall![1]).toBe('mock-uuid') // id

      // Should enqueue create sync entry
      expect(mockSyncQueueRepo.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ operation: 'create', entityId: 'mock-uuid', entityType: 'recipe' })
      )

      // Should call sub-repositories
      expect(mockIngredientRepo.replaceForRecipe).toHaveBeenCalledWith('mock-uuid', input.ingredients)
      expect(mockStepRepo.replaceForRecipe).toHaveBeenCalledWith('mock-uuid', input.steps)
      expect(mockTagRepo.reconcileForRecipe).toHaveBeenCalledWith('mock-uuid', input.tags)

      expect(recipe.id).toBe('mock-uuid')
      expect(recipe.title).toBe('Test Recipe')
    })
  })

  describe('updateRecipe', () => {
    it('updates existing row', async () => {
      const input = { title: 'Updated Recipe' }

      const recipe = await repo.updateRecipe('mock-uuid', input)

      const updateCall = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('UPDATE recipes SET')
      )
      expect(updateCall).toBeDefined()

      // Should enqueue update sync entry
      expect(mockSyncQueueRepo.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ operation: 'update', entityId: 'mock-uuid' })
      )

      expect(recipe.id).toBe('mock-uuid')
    })
  })

  describe('deleteRecipe', () => {
    it('sets deleted_at and enqueues delete sync entry', async () => {
      await repo.deleteRecipe('mock-uuid')

      const deleteCall = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('deleted_at')
      )
      expect(deleteCall).toBeDefined()
      expect(deleteCall![0]).toContain('UPDATE recipes SET deleted_at')

      // Should enqueue delete sync entry
      expect(mockSyncQueueRepo.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ operation: 'delete', entityId: 'mock-uuid' })
      )
    })
  })

  describe('listRecipes', () => {
    it('with no filters returns all non-deleted', async () => {
      mockDb.getAllAsync.mockResolvedValue([MOCK_RECIPE_ROW])

      const recipes = await repo.listRecipes({})

      const sqlArg: string = mockDb.getAllAsync.mock.calls[0][0]
      expect(sqlArg).toContain('deleted_at IS NULL')
      expect(recipes).toHaveLength(1)
      expect(recipes[0].title).toBe('Test Recipe')
    })

    it('with isFavorite: true adds correct WHERE clause', async () => {
      await repo.listRecipes({ isFavorite: true })

      const sqlArg: string = mockDb.getAllAsync.mock.calls[0][0]
      const params: unknown[] = mockDb.getAllAsync.mock.calls[0].slice(1)

      expect(sqlArg).toContain('is_favorite = ?')
      expect(params).toContain(1)
    })

    it('with searchText adds LIKE clause', async () => {
      await repo.listRecipes({ searchText: 'pasta' })

      const sqlArg: string = mockDb.getAllAsync.mock.calls[0][0]
      const params: unknown[] = mockDb.getAllAsync.mock.calls[0].slice(1)

      expect(sqlArg).toContain('search_text LIKE ?')
      expect(params).toContain('%pasta%')
    })
  })

  describe('toggleFavorite', () => {
    it('updates is_favorite field', async () => {
      await repo.toggleFavorite('mock-uuid', true)

      const updateCall = mockDb.runAsync.mock.calls.find((call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('is_favorite')
      )
      expect(updateCall).toBeDefined()
      expect(updateCall![1]).toBe(1) // isFavorite = true → 1

      expect(mockSyncQueueRepo.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ operation: 'update', entityId: 'mock-uuid' })
      )
    })
  })

  describe('getRecipeById', () => {
    it('returns null for deleted recipe (filtered by WHERE deleted_at IS NULL)', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null)

      const result = await repo.getRecipeById('deleted-id')

      const sqlArg: string = mockDb.getFirstAsync.mock.calls[0][0]
      expect(sqlArg).toContain('deleted_at IS NULL')
      expect(result).toBeNull()
    })

    it('returns mapped recipe when found', async () => {
      const result = await repo.getRecipeById('mock-uuid')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('mock-uuid')
      expect(result!.title).toBe('Test Recipe')
      expect(result!.isFavorite).toBe(false)
    })
  })
})
