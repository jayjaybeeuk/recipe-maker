import { describe, it, expect } from 'vitest'
import { buildRecipeQuery, type RecipeFilters } from '../query-builder'

const emptyFilters: RecipeFilters = {
  searchText: '',
  cuisine: null,
  mealType: null,
  tags: [],
  isFavorite: false,
  maxTotalMinutes: null,
  sortBy: 'newest',
}

describe('buildRecipeQuery', () => {
  describe('No filters', () => {
    it('SQL contains WHERE r.deleted_at IS NULL', () => {
      const { sql } = buildRecipeQuery(emptyFilters)
      expect(sql).toContain('WHERE r.deleted_at IS NULL')
    })

    it('SQL contains ORDER BY r.created_at DESC', () => {
      const { sql } = buildRecipeQuery(emptyFilters)
      expect(sql).toContain('ORDER BY r.created_at DESC')
    })

    it('SQL contains LIMIT and OFFSET', () => {
      const { sql } = buildRecipeQuery(emptyFilters)
      expect(sql).toContain('LIMIT ?')
      expect(sql).toContain('OFFSET ?')
    })

    it('params array ends with [100, 0] (default limit/offset)', () => {
      const { params } = buildRecipeQuery(emptyFilters)
      expect(params.at(-2)).toBe(100)
      expect(params.at(-1)).toBe(0)
    })
  })

  describe('searchText filter', () => {
    it('non-empty searchText adds LIKE clause to SQL', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, searchText: 'pasta' })
      expect(sql).toContain('LIKE ?')
    })

    it('params include %term% for each of the three search columns', () => {
      const { params } = buildRecipeQuery({ ...emptyFilters, searchText: 'pasta' })
      expect(params).toContain('%pasta%')
      // Three LIKE params for search_text, search_ingredients, search_tags
      expect(params.filter(p => p === '%pasta%')).toHaveLength(3)
    })

    it('empty searchText does NOT add LIKE clause', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, searchText: '' })
      expect(sql).not.toContain('search_text LIKE')
    })

    it('whitespace-only searchText does NOT add LIKE clause', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, searchText: '   ' })
      expect(sql).not.toContain('search_text LIKE')
    })
  })

  describe('Individual filters', () => {
    it('cuisine: "Italian" → SQL contains r.cuisine = ?, params contain "Italian"', () => {
      const { sql, params } = buildRecipeQuery({ ...emptyFilters, cuisine: 'Italian' })
      expect(sql).toContain('r.cuisine = ?')
      expect(params).toContain('Italian')
    })

    it('mealType: "Dinner" → SQL contains r.meal_type = ?, params contain "Dinner"', () => {
      const { sql, params } = buildRecipeQuery({ ...emptyFilters, mealType: 'Dinner' })
      expect(sql).toContain('r.meal_type = ?')
      expect(params).toContain('Dinner')
    })

    it('isFavorite: true → SQL contains r.is_favorite = 1', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, isFavorite: true })
      expect(sql).toContain('r.is_favorite = 1')
    })

    it('isFavorite: true → no extra param for the is_favorite condition', () => {
      const withFav = buildRecipeQuery({ ...emptyFilters, isFavorite: true })
      const withoutFav = buildRecipeQuery(emptyFilters)
      // Both end with LIMIT/OFFSET params; no extra param added for isFavorite
      expect(withFav.params.length).toBe(withoutFav.params.length)
    })

    it('isFavorite: false → SQL does NOT contain is_favorite', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, isFavorite: false })
      expect(sql).not.toContain('is_favorite')
    })

    it('maxTotalMinutes: 30 → SQL contains COALESCE time clause, params contain 30', () => {
      const { sql, params } = buildRecipeQuery({ ...emptyFilters, maxTotalMinutes: 30 })
      expect(sql).toContain('COALESCE')
      expect(params).toContain(30)
    })
  })

  describe('Tags filter', () => {
    it('single tag → SQL contains one search_tags LIKE ?, params contain %tagname%', () => {
      const { sql, params } = buildRecipeQuery({ ...emptyFilters, tags: ['vegan'] })
      expect(sql).toContain('search_tags LIKE ?')
      expect(params).toContain('%vegan%')
    })

    it('two tags → SQL contains two separate tag LIKE clauses', () => {
      const { sql, params } = buildRecipeQuery({ ...emptyFilters, tags: ['vegan', 'gluten-free'] })
      const occurrences = (sql.match(/search_tags LIKE \?/g) ?? []).length
      expect(occurrences).toBe(2)
      expect(params).toContain('%vegan%')
      expect(params).toContain('%gluten-free%')
    })
  })

  describe('Sort options', () => {
    it('newest → SQL contains ORDER BY r.created_at DESC', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, sortBy: 'newest' })
      expect(sql).toContain('ORDER BY r.created_at DESC')
    })

    it('updated → SQL contains ORDER BY r.updated_at DESC', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, sortBy: 'updated' })
      expect(sql).toContain('ORDER BY r.updated_at DESC')
    })

    it('favorite → SQL contains ORDER BY r.is_favorite DESC', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, sortBy: 'favorite' })
      expect(sql).toContain('ORDER BY r.is_favorite DESC')
    })

    it('quickest → SQL contains COALESCE in ORDER BY', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, sortBy: 'quickest' })
      expect(sql).toMatch(/ORDER BY.*COALESCE/)
    })

    it('rated → SQL contains ORDER BY r.rating DESC', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, sortBy: 'rated' })
      expect(sql).toContain('ORDER BY r.rating DESC')
    })

    it('lastCooked → SQL contains ORDER BY r.last_cooked_at DESC', () => {
      const { sql } = buildRecipeQuery({ ...emptyFilters, sortBy: 'lastCooked' })
      expect(sql).toContain('ORDER BY r.last_cooked_at DESC')
    })
  })

  describe('Combined filters', () => {
    it('searchText + cuisine + isFavorite → all three clauses present in SQL', () => {
      const { sql } = buildRecipeQuery({
        ...emptyFilters,
        searchText: 'pasta',
        cuisine: 'Italian',
        isFavorite: true,
      })
      expect(sql).toContain('LIKE ?')
      expect(sql).toContain('r.cuisine = ?')
      expect(sql).toContain('r.is_favorite = 1')
    })

    it('all filters active → param count matches ? count in SQL', () => {
      const { sql, params } = buildRecipeQuery(
        {
          searchText: 'pasta',
          cuisine: 'Italian',
          mealType: 'Dinner',
          tags: ['vegan', 'gluten-free'],
          isFavorite: true,
          maxTotalMinutes: 30,
          sortBy: 'rated',
        },
        50,
        10
      )
      const placeholderCount = (sql.match(/\?/g) ?? []).length
      expect(params.length).toBe(placeholderCount)
    })
  })
})
