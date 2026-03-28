import React, { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRecipeStore } from '../../../features/recipes/store'
import { HeroImage } from '../../../shared/components/HeroImage'
import { Badge } from '../../../shared/components/ui/badge'
import { Button } from '../../../shared/components/ui/button'
import { Separator } from '../../../shared/components/ui/separator'
import { Skeleton } from '../../../shared/components/ui/skeleton'
import { Text } from '../../../shared/components/ui/text'

function DetailSkeleton() {
  return (
    <ScrollView>
      <Skeleton className="w-full h-56" />
      <View className="p-4 gap-3">
        <Skeleton className="h-8 w-3/4" />
        <View className="flex-row gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </View>
        <Skeleton className="h-4 w-full mt-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full mt-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </View>
    </ScrollView>
  )
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { selectedRecipe, ingredients, steps, tags, isLoading, loadRecipeById, toggleFavorite } =
    useRecipeStore()

  useEffect(() => {
    if (id) {
      loadRecipeById(id)
    }
  }, [id])

  if (isLoading || !selectedRecipe) {
    return <DetailSkeleton />
  }

  const recipe = selectedRecipe

  const totalMinutes = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
  const timeLabel =
    totalMinutes > 0
      ? totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60 > 0 ? `${totalMinutes % 60}m` : ''}`.trim()
        : `${totalMinutes}m`
      : null

  const ratingStars = recipe.rating ? '★'.repeat(recipe.rating) + '☆'.repeat(5 - recipe.rating) : null

  return (
    <ScrollView className="flex-1 bg-white">
      {/* 1. Hero Image */}
      <HeroImage uri={recipe.imageUri} title={recipe.title} />

      {/* 2. Header row */}
      <View className="px-4 pt-4 pb-2 flex-row items-start justify-between">
        <Text variant="h1" className="flex-1 mr-2">
          {recipe.title}
        </Text>
        <View className="flex-row items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => toggleFavorite(recipe.id, !recipe.isFavorite)}
            className="min-w-[44px] min-h-[44px] items-center justify-center p-0"
          >
            <Text className={`text-2xl ${recipe.isFavorite ? 'text-brand-500' : 'text-gray-300'}`}>
              {recipe.isFavorite ? '★' : '☆'}
            </Text>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push(`/(stack)/recipes/${recipe.id}/edit` as never)}
          >
            Edit
          </Button>
        </View>
      </View>

      {/* 3. Metadata chips */}
      <View className="px-4 py-2 flex-row flex-wrap gap-2">
        {recipe.cuisine && <Badge variant="secondary">{recipe.cuisine}</Badge>}
        {recipe.mealType && <Badge variant="secondary">{recipe.mealType}</Badge>}
        {recipe.difficulty && (
          <Badge variant="secondary">
            {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
          </Badge>
        )}
        {recipe.prepTimeMinutes != null && (
          <Badge variant="outline">Prep {recipe.prepTimeMinutes}m</Badge>
        )}
        {recipe.cookTimeMinutes != null && (
          <Badge variant="outline">Cook {recipe.cookTimeMinutes}m</Badge>
        )}
        {recipe.servings != null && (
          <Badge variant="outline">{recipe.servings} servings</Badge>
        )}
        {ratingStars && <Badge variant="secondary">{ratingStars}</Badge>}
        {tags.map((tag) => (
          <Badge key={tag.id} variant="default">
            {tag.name}
          </Badge>
        ))}
      </View>

      {/* 4. Ingredients */}
      {ingredients.length > 0 && (
        <View className="px-4 mt-2">
          <Separator className="mb-4" />
          <Text variant="h2" className="mb-3">
            Ingredients
          </Text>
          {ingredients.map((ingredient) => (
            <View key={ingredient.id} className="flex-row items-baseline mb-1.5">
              <Text className="text-brand-500 mr-2">•</Text>
              <Text>
                {ingredient.quantity != null ? `${ingredient.quantity} ` : ''}
                {ingredient.unit ? `${ingredient.unit} ` : ''}
                {ingredient.name}
                {ingredient.optional ? ' (optional)' : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 5. Steps */}
      {steps.length > 0 && (
        <View className="px-4 mt-4">
          <Separator className="mb-4" />
          <Text variant="h2" className="mb-3">
            Instructions
          </Text>
          {steps.map((step, index) => (
            <View key={step.id} className="flex-row items-start mb-4">
              <View className="w-7 h-7 rounded-full bg-brand-500 items-center justify-center mr-3 mt-0.5 shrink-0">
                <Text className="text-white text-sm font-bold">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <Text>{step.instruction}</Text>
                {step.durationMinutes != null && (
                  <Badge variant="outline" className="mt-1 self-start">
                    ⏱ {step.durationMinutes}m
                  </Badge>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 6. Notes */}
      {recipe.notes && (
        <View className="px-4 mt-4">
          <Separator className="mb-4" />
          <Text variant="h2" className="mb-2">
            Notes
          </Text>
          <Text variant="muted">{recipe.notes}</Text>
        </View>
      )}

      {/* 7. Source link */}
      {recipe.sourceUrl && (
        <View className="px-4 mt-4">
          <Separator className="mb-4" />
          <Text variant="small" className="text-gray-500">
            Source: {recipe.sourceUrl}
          </Text>
        </View>
      )}

      {/* 8. Start Cooking CTA */}
      <View className="px-4 mt-6 mb-8">
        <Button
          size="lg"
          className="w-full"
          onPress={() => router.push(`/(stack)/recipes/${recipe.id}/cook` as never)}
        >
          Start Cooking
        </Button>
      </View>
    </ScrollView>
  )
}
