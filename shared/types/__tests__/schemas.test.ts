import { describe, it, expect } from 'vitest'
import { recipeFormSchema, ingredientInputSchema } from '../schemas'

const validIngredient = { name: 'flour', quantity: 1, unit: 'cup', optional: false }
const validStep = { instruction: 'Mix flour with water', durationMinutes: null }

const validRecipe = {
  title: 'Banana Bread',
  ingredients: [validIngredient],
  steps: [validStep],
  tags: [],
}

describe('recipeFormSchema', () => {
  it('valid complete recipe form passes validation', () => {
    const full = {
      ...validRecipe,
      description: 'A moist loaf',
      cuisine: 'American',
      mealType: 'breakfast',
      difficulty: 'easy' as const,
      prepTimeMinutes: 15,
      cookTimeMinutes: 60,
      servings: 8,
      rating: 4,
      sourceUrl: 'https://example.com/recipe',
      notes: 'Use ripe bananas',
      imageUri: '/local/image.jpg',
    }
    const result = recipeFormSchema.safeParse(full)
    expect(result.success).toBe(true)
  })

  it('missing title fails with Title is required', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, title: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleError = result.error.issues.find(i => i.path.includes('title'))
      expect(titleError?.message).toBe('Title is required')
    }
  })

  it('empty ingredients array fails with At least one ingredient is required', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, ingredients: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error.issues.find(i => i.path.includes('ingredients'))
      expect(error?.message).toBe('At least one ingredient is required')
    }
  })

  it('empty steps array fails with At least one step is required', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, steps: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error.issues.find(i => i.path.includes('steps'))
      expect(error?.message).toBe('At least one step is required')
    }
  })

  it('invalid URL in sourceUrl fails with Must be a valid URL', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, sourceUrl: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error.issues.find(i => i.path.includes('sourceUrl'))
      expect(error?.message).toBe('Must be a valid URL')
    }
  })

  it('rating of 6 fails (max 5)', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, rating: 6 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error.issues.find(i => i.path.includes('rating'))
      expect(error).toBeDefined()
    }
  })

  it('rating of 0 fails (min 1)', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, rating: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error.issues.find(i => i.path.includes('rating'))
      expect(error).toBeDefined()
    }
  })

  it('sourceUrl of empty string passes (allowed)', () => {
    const result = recipeFormSchema.safeParse({ ...validRecipe, sourceUrl: '' })
    expect(result.success).toBe(true)
  })
})

describe('ingredientInputSchema', () => {
  it('ingredient with empty name fails', () => {
    const result = ingredientInputSchema.safeParse({ name: '', quantity: null, unit: null, optional: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error.issues.find(i => i.path.includes('name'))
      expect(error?.message).toBe('Ingredient name is required')
    }
  })

  it('valid ingredient passes', () => {
    const result = ingredientInputSchema.safeParse(validIngredient)
    expect(result.success).toBe(true)
  })
})
