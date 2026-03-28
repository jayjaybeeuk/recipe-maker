import React, { useEffect, useState } from 'react'
import { Alert, View, Text } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { RecipeForm } from '../../../../features/recipes/components/RecipeForm'
import type { RecipeFormValues } from '../../../../shared/types/schemas'
import { useRecipeStore } from '../../../../features/recipes/store'
import { Button } from '../../../../shared/components/ui/button'
import { Skeleton } from '../../../../shared/components/ui/skeleton'
import type { Recipe, Ingredient, Step, Tag } from '../../../../shared/types'

function recipeToFormValues(
  recipe: Recipe,
  ingredients: Ingredient[],
  steps: Step[],
  tags: Tag[]
): Partial<RecipeFormValues> {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    cuisine: recipe.cuisine ?? '',
    mealType: recipe.mealType ?? '',
    difficulty: recipe.difficulty ?? undefined,
    prepTimeMinutes: recipe.prepTimeMinutes ?? undefined,
    cookTimeMinutes: recipe.cookTimeMinutes ?? undefined,
    servings: recipe.servings ?? undefined,
    rating: recipe.rating ?? undefined,
    sourceUrl: recipe.sourceUrl ?? '',
    notes: recipe.notes ?? '',
    imageUri: recipe.imageUri ?? undefined,
    ingredients:
      ingredients.length > 0
        ? ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            optional: ing.optional,
          }))
        : [{ name: '', quantity: null, unit: null, optional: false }],
    steps:
      steps.length > 0
        ? steps.map((s) => ({
            instruction: s.instruction,
            durationMinutes: s.durationMinutes,
          }))
        : [{ instruction: '', durationMinutes: null }],
    tags: tags.map((t) => t.name),
  }
}

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { selectedRecipe, ingredients, steps, tags, isLoading, loadRecipeById, updateRecipe, deleteRecipe } =
    useRecipeStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) loadRecipeById(id)
  }, [id])

  async function handleSubmit(values: RecipeFormValues) {
    if (!id) return
    setIsSubmitting(true)
    try {
      await updateRecipe(id, {
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

  function handleDelete() {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return
            await deleteRecipe(id)
            router.replace('/(tabs)/recipes')
          },
        },
      ]
    )
  }

  if (isLoading || !selectedRecipe) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Recipe' }} />
        <View className="flex-1 p-4 gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-2/3 rounded-lg" />
        </View>
      </>
    )
  }

  const formValues = recipeToFormValues(selectedRecipe, ingredients, steps, tags)

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Recipe',
          headerRight: () => (
            <Button variant="ghost" onPress={handleDelete} size="sm">
              <Text className="text-red-500 font-semibold">Delete</Text>
            </Button>
          ),
        }}
      />
      <RecipeForm
        defaultValues={formValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
