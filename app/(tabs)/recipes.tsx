import React, { useEffect, useState, useCallback } from 'react'
import { FlatList, View, TouchableOpacity, Text as RNText } from 'react-native'
import { router } from 'expo-router'
import { useRecipeStore } from '../../features/recipes/store'
import { tagRepository } from '../../infra/db/repositories/index'
import { RecipeCard } from '../../shared/components/RecipeCard'
import { EmptyState } from '../../shared/components/EmptyState'
import { Skeleton } from '../../shared/components/ui/skeleton'
import type { Recipe, Tag } from '../../shared/types'

function SkeletonCard() {
  return (
    <View className="mb-3">
      <Skeleton className="w-full h-40 rounded-t-2xl" />
      <View className="bg-surface rounded-b-2xl px-4 py-3 border border-surface-muted border-t-0">
        <Skeleton className="h-6 w-3/4 mb-2 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </View>
    </View>
  )
}

export default function RecipesScreen() {
  const { recipes, isLoading, loadRecipes, toggleFavorite } = useRecipeStore()
  const [tagMap, setTagMap] = useState<Record<string, Tag[]>>({})

  const fetchTags = useCallback(async (recipeList: Recipe[]) => {
    const entries = await Promise.all(
      recipeList.map(async (r) => {
        const tags = await tagRepository.listByRecipeId(r.id)
        return [r.id, tags] as const
      })
    )
    setTagMap(Object.fromEntries(entries))
  }, [])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  useEffect(() => {
    if (recipes.length > 0) {
      fetchTags(recipes)
    }
  }, [recipes, fetchTags])

  const handleToggleFavorite = useCallback(
    (id: string, current: boolean) => {
      toggleFavorite(id, !current)
    },
    [toggleFavorite]
  )

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={isLoading ? [] : recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          isLoading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <EmptyState
              title="No Recipes Yet"
              message="Start building your cookbook by adding your first recipe."
              action={{
                label: 'Add Recipe',
                onPress: () => router.push('/(stack)/recipes/new'),
              }}
            />
          )
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            tags={tagMap[item.id] ?? []}
            onPress={() => router.push(`/(stack)/recipes/${item.id}`)}
            onToggleFavorite={() => handleToggleFavorite(item.id, item.isFavorite)}
          />
        )}
      />

      {/* Floating add button */}
      <TouchableOpacity
        onPress={() => router.push('/(stack)/recipes/new')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-brand-500 rounded-full items-center justify-center shadow-lg"
        accessibilityLabel="Add recipe"
        accessibilityRole="button"
      >
        <RNText className="text-white text-3xl leading-none">+</RNText>
      </TouchableOpacity>
    </View>
  )
}
