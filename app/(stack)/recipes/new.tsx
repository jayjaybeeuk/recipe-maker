import React, { useState } from 'react'
import { Stack, router } from 'expo-router'
import { RecipeForm } from '../../../features/recipes/components/RecipeForm'
import type { RecipeFormValues } from '../../../shared/types/schemas'
import { useRecipeStore } from '../../../features/recipes/store'

export default function AddRecipeScreen() {
  const createRecipe = useRecipeStore((s) => s.createRecipe)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(values: RecipeFormValues) {
    setIsSubmitting(true)
    try {
      await createRecipe({
        title: values.title,
        description: values.description || undefined,
        prepTimeMinutes: values.prepTimeMinutes,
        cookTimeMinutes: values.cookTimeMinutes,
        servings: values.servings,
        difficulty: values.difficulty,
        cuisine: values.cuisine || undefined,
        mealType: values.mealType || undefined,
        sourceUrl: values.sourceUrl || undefined,
        notes: values.notes || undefined,
        rating: values.rating,
        isFavorite: false,
        imageUri: values.imageUri,
        ingredients: values.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          optional: ing.optional,
        })),
        steps: values.steps.map((step) => ({
          instruction: step.instruction,
          durationMinutes: step.durationMinutes ?? null,
        })),
        tags: values.tags,
      })
      router.back()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New Recipe' }} />
      <RecipeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  )
}
