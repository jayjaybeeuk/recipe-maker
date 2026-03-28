import type { SortOption } from '../../shared/types'

export interface RecipeFilters {
  searchText: string
  cuisine: string | null
  mealType: string | null
  tags: string[]
  isFavorite: boolean
  maxTotalMinutes: number | null
  sortBy: SortOption
}

export interface BuiltQuery {
  sql: string
  params: (string | number)[]
}

function buildSortClause(sortBy: SortOption): string {
  switch (sortBy) {
    case 'newest':
      return 'ORDER BY r.created_at DESC'
    case 'updated':
      return 'ORDER BY r.updated_at DESC'
    case 'favorite':
      return 'ORDER BY r.is_favorite DESC, r.created_at DESC'
    case 'quickest':
      return 'ORDER BY (COALESCE(r.prep_time_minutes, 0) + COALESCE(r.cook_time_minutes, 0)) ASC'
    case 'rated':
      return 'ORDER BY r.rating DESC'
    case 'lastCooked':
      return 'ORDER BY r.last_cooked_at DESC'
    default:
      return 'ORDER BY r.created_at DESC'
  }
}

export function buildRecipeQuery(filters: RecipeFilters, limit = 100, offset = 0): BuiltQuery {
  const conditions: string[] = ['r.deleted_at IS NULL']
  const params: (string | number)[] = []

  const trimmed = filters.searchText.trim()
  if (trimmed) {
    const term = `%${trimmed}%`
    conditions.push('(r.search_text LIKE ? OR r.search_ingredients LIKE ? OR r.search_tags LIKE ?)')
    params.push(term, term, term)
  }

  if (filters.cuisine !== null) {
    conditions.push('r.cuisine = ?')
    params.push(filters.cuisine)
  }

  if (filters.mealType !== null) {
    conditions.push('r.meal_type = ?')
    params.push(filters.mealType)
  }

  if (filters.isFavorite === true) {
    conditions.push('r.is_favorite = 1')
  }

  if (filters.maxTotalMinutes !== null) {
    conditions.push('(COALESCE(r.prep_time_minutes, 0) + COALESCE(r.cook_time_minutes, 0)) <= ?')
    params.push(filters.maxTotalMinutes)
  }

  for (const tag of filters.tags) {
    conditions.push('r.search_tags LIKE ?')
    params.push(`%${tag}%`)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const sort = buildSortClause(filters.sortBy)

  const sql = `SELECT r.* FROM recipes r ${where} ${sort} LIMIT ? OFFSET ?`
  params.push(limit, offset)

  return { sql, params }
}
