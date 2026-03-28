import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Platform, ScrollView, TouchableOpacity, View, Text as RNText } from 'react-native'
import { router } from 'expo-router'
import { tagRepository } from '../../infra/db/repositories/index'
import { recipeRepository } from '../../infra/db/repositories/index'
import { RecipeCard } from '../../shared/components/RecipeCard'
import { EmptyState } from '../../shared/components/EmptyState'
import { Skeleton } from '../../shared/components/ui/skeleton'
import { Button } from '../../shared/components/ui/button'
import { Text } from '../../shared/components/ui/text'
import { useRecipeStore } from '../../features/recipes/store'
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

function CompactSkeletonCard() {
  return (
    <View className="mr-3 w-40">
      <Skeleton className="w-40 h-28 rounded-t-xl" />
      <View className="bg-surface rounded-b-xl px-2 py-2 border border-surface-muted border-t-0">
        <Skeleton className="h-4 w-full rounded mb-1" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </View>
    </View>
  )
}

export default function HomeScreen() {
  const { toggleFavorite } = useRecipeStore()
  const [favorites, setFavorites] = useState<Recipe[]>([])
  const [recentlyCooked, setRecentlyCooked] = useState<Recipe[]>([])
  const [favTagMap, setFavTagMap] = useState<Record<string, Tag[]>>({})
  const [recentTagMap, setRecentTagMap] = useState<Record<string, Tag[]>>({})
  const [loadingFav, setLoadingFav] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)

  const loadTagsFor = useCallback(async (list: Recipe[]): Promise<Record<string, Tag[]>> => {
    const entries = await Promise.all(
      list.map(async (r) => {
        const tags = await tagRepository.listByRecipeId(r.id)
        return [r.id, tags] as const
      })
    )
    return Object.fromEntries(entries)
  }, [])

  const loadFavorites = useCallback(async () => {
    setLoadingFav(true)
    try {
      const list = await recipeRepository.listRecipes({ isFavorite: true, limit: 10, sortBy: 'newest' })
      setFavorites(list)
      const tags = await loadTagsFor(list)
      setFavTagMap(tags)
    } finally {
      setLoadingFav(false)
    }
  }, [loadTagsFor])

  const loadRecentlyCooked = useCallback(async () => {
    setLoadingRecent(true)
    try {
      const list = await recipeRepository.listRecipes({ sortBy: 'lastCooked', limit: 5 })
      setRecentlyCooked(list)
      const tags = await loadTagsFor(list)
      setRecentTagMap(tags)
    } finally {
      setLoadingRecent(false)
    }
  }, [loadTagsFor])

  useEffect(() => {
    loadFavorites()
    loadRecentlyCooked()
  }, [loadFavorites, loadRecentlyCooked])

  const handleToggleFavorite = useCallback(
    async (id: string, current: boolean) => {
      await toggleFavorite(id, !current)
      loadFavorites()
    },
    [toggleFavorite, loadFavorites]
  )

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text variant="h1" className="mb-6">
        My Cookbook
      </Text>

      {/* Favorites section */}
      <View className="mb-6">
        <Text variant="h2" className="mb-3">
          Favorites
        </Text>
        {loadingFav ? (
          <FlatList
            horizontal
            data={[1, 2, 3]}
            keyExtractor={(item) => String(item)}
            renderItem={() => <CompactSkeletonCard />}
            showsHorizontalScrollIndicator={false}
          />
        ) : favorites.length === 0 ? (
          <EmptyState
            title="No Favorites Yet"
            message="Star a recipe to see it here."
          />
        ) : (
          <FlatList
            horizontal
            data={favorites}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="mr-3 w-52">
                <RecipeCard
                  recipe={item}
                  tags={favTagMap[item.id] ?? []}
                  onPress={() => router.push(`/(stack)/recipes/${item.id}`)}
                  onToggleFavorite={() => handleToggleFavorite(item.id, item.isFavorite)}
                />
              </View>
            )}
          />
        )}
      </View>

      {/* Recently Cooked section */}
      <View className="mb-6">
        <Text variant="h2" className="mb-3">
          Recently Cooked
        </Text>
        {loadingRecent ? (
          <View>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : recentlyCooked.length === 0 ? (
          <EmptyState
            title="Nothing Cooked Yet"
            message="Start cooking a recipe to track it here."
          />
        ) : (
          recentlyCooked.map((item) => (
            <RecipeCard
              key={item.id}
              recipe={item}
              tags={recentTagMap[item.id] ?? []}
              onPress={() => router.push(`/(stack)/recipes/${item.id}`)}
              onToggleFavorite={() => handleToggleFavorite(item.id, item.isFavorite)}
            />
          ))
        )}
      </View>

      {/* Quick actions */}
      <View className="gap-3 mb-6">
        <Button
          variant="outline"
          onPress={() => router.push('/(tabs)/recipes')}
        >
          Browse All Recipes
        </Button>
        <Button
          onPress={() => router.push('/(stack)/recipes/new')}
        >
          Add Recipe
        </Button>
      </View>
    </ScrollView>
  )
}
