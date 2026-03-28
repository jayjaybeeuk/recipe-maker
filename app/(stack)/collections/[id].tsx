import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, View } from 'react-native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { collectionRepository, tagRepository } from '../../../infra/db/repositories/index'
import { RecipeCard } from '../../../shared/components/RecipeCard'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Skeleton } from '../../../shared/components/ui/skeleton'
import { useRecipeStore } from '../../../features/recipes/store'
import type { Recipe, Tag } from '../../../shared/types'

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

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { toggleFavorite } = useRecipeStore()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [tagMap, setTagMap] = useState<Record<string, Tag[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [list, collections] = await Promise.all([
        collectionRepository.listRecipesInCollection(id),
        collectionRepository.listCollections(),
      ])
      setRecipes(list)

      const collection = collections.find((c) => c.id === id)
      if (collection) {
        navigation.setOptions({ title: collection.name })
      }

      const entries = await Promise.all(
        list.map(async (r) => {
          const tags = await tagRepository.listByRecipeId(r.id)
          return [r.id, tags] as const
        })
      )
      setTagMap(Object.fromEntries(entries))
    } finally {
      setIsLoading(false)
    }
  }, [id, navigation])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleFavorite = useCallback(
    async (recipeId: string, current: boolean) => {
      await toggleFavorite(recipeId, !current)
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, isFavorite: !current } : r))
      )
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
              title="No Recipes"
              message="This collection has no recipes yet."
              action={{
                label: 'Browse Recipes',
                onPress: () => router.push('/(tabs)/recipes'),
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
    </View>
  )
}
