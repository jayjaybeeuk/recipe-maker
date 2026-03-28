import { describe, it, expect } from 'vitest'
import type { SortOption } from '@shared/types/index'

describe('SortOption type', () => {
  it('SortOption values are valid', () => {
    const sortOptions: SortOption[] = [
      'newest',
      'updated',
      'favorite',
      'quickest',
      'rated',
      'lastCooked',
    ]
    expect(sortOptions).toHaveLength(6)
  })
})
