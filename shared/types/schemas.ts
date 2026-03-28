import { z } from 'zod'

export const ingredientInputSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.number().positive().nullable().optional().default(null),
  unit: z.string().nullable().optional().default(null),
  optional: z.boolean().default(false),
})

export const stepInputSchema = z.object({
  instruction: z.string().min(1, 'Step instruction is required'),
  durationMinutes: z.number().int().positive().nullable().optional().default(null),
})

export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  mealType: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  prepTimeMinutes: z.number().int().positive().optional(),
  cookTimeMinutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  imageUri: z.string().optional(),
  ingredients: z.array(ingredientInputSchema).min(1, 'At least one ingredient is required'),
  steps: z.array(stepInputSchema).min(1, 'At least one step is required'),
  tags: z.array(z.string()).default([]),
})

export type RecipeFormValues = z.infer<typeof recipeFormSchema>
