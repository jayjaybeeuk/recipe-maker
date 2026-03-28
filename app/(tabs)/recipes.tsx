import React, { useEffect, useState, useCallback, useRef } from 'react'
import { FlatList, View, TouchableOpacity, Text as RNText, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useRecipeStore } from '../../features/recipes/store'
import { useSearchStore } from '../../features/search/store'
import { SearchInput, FilterChips, SortSelector, FilterSheet } from '../../features/search/components'
import { recipeRepository, tagRepository } from '../../infra/db/repositories/index'
import { RecipeCard } from '../../shared/components/RecipeCard'
import { EmptyState } from '../../shared/components/EmptyState'
import { Skeleton } from '../../shared/components/ui/skeleton'
import { useDebounce } from '../../shared/utils/useDebounce'
import type { Recipe, Tag } from '../../shared/types'
import type { RecipeFilters } from '../../features/search/query-builder'

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
  const { toggleFavorite } = useRecipeStore()
  const {
    searchText,
    cuisine,
    mealType,
    tags,
    isFavorite,
    maxTotalMinutes,
    sortBy,
    setSearchText,
    setCuisine,
    setMealType,
    toggleTag,
    setIsFavorite,
    setMaxTotalMinutes,
    setSortBy,
    clearAll,
  } = useSearchStore()

  const [inputValue, setInputValue] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [tagMap, setTagMap] = useState<Record<string, Tag[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filterSheetVisible, setFilterSheetVisible] = useState(false)

  const activeFilterCount =
    (cuisine !== null ? 1 : 0) +
    (mealType !== null ? 1 : 0) +
    tags.length +
    (isFavorite ? 1 : 0) +
    (maxTotalMinutes !== null ? 1 : 0)

  const debouncedSearchText = useDebounce(inputValue, 150)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Sync debounced input to store
  useEffect(() => {
    setSearchText(debouncedSearchText)
  }, [debouncedSearchText, setSearchText])

  // Load recipes when filter values change
  useEffect(() => {
    setIsLoading(true)
    recipeRepository
      .listRecipes({
        searchText: searchText || undefined,
        cuisine: cuisine ?? undefined,
        mealType: mealType ?? undefined,
        tags: tags.length > 0 ? tags : undefined,
        isFavorite: isFavorite || undefined,
        maxTotalMinutes: maxTotalMinutes ?? undefined,
        sortBy,
      })
      .then(async (list) => {
        if (!isMounted.current) return
        setRecipes(list)
        const entries = await Promise.all(
          list.map(async (r) => {
            const recipeTags = await tagRepository.listByRecipeId(r.id)
            return [r.id, recipeTags] as const
          })
        )
        if (!isMounted.current) return
        setTagMap(Object.fromEntries(entries))
      })
      .catch(() => {
        if (isMounted.current) setRecipes([])
      })
      .finally(() => {
        if (isMounted.current) setIsLoading(false)
      })
  }, [searchText, cuisine, mealType, tags, isFavorite, maxTotalMinutes, sortBy])

  const handleToggleFavorite = useCallback(
    (id: string, current: boolean) => {
      toggleFavorite(id, !current)
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isFavorite: !current } : r))
      )
    },
    [toggleFavorite]
  )

  const currentFilters: RecipeFilters = {
    searchText: debouncedSearchText,
    cuisine,
    mealType,
    tags,
    isFavorite,
    maxTotalMinutes,
    sortBy,
  }

  return (
    <View className="flex-1 bg-background">
      {/* Search + view toggle row */}
      <View className="flex-row items-center px-4 pt-4 pb-2 gap-2">
        <View className="flex-1">
          <SearchInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Search recipes…"
          />
        </View>
        <Pressable
          onPress={() => setViewMode((v) => (v === 'list' ? 'grid' : 'list'))}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          accessibilityLabel={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
        >
          <RNText className="text-xl text-gray-600">{viewMode === 'list' ? '⊞' : '☰'}</RNText>
        </Pressable>
      </View>

      {/* Filter chips */}
      <View className="px-4">
        <FilterChips
          filters={currentFilters}
          onRemoveCuisine={() => setCuisine(null)}
          onRemoveMealType={() => setMealType(null)}
          onRemoveTag={(tag) => toggleTag(tag)}
          onClearFavorite={() => setIsFavorite(false)}
          onClearTime={() => setMaxTotalMinutes(null)}
          onClearAll={clearAll}
        />
      </View>

      {/* Sort + Filters row */}
      <View className="flex-row items-center px-4 pb-2">
        <RNText className="text-sm text-gray-500 mr-2">Sort:</RNText>
        <SortSelector value={sortBy} onChange={setSortBy} />
        <View className="flex-1" />
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          className="flex-row items-center ml-3"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RNText className="text-sm text-brand-500 font-semibold">Filters</RNText>
          {activeFilterCount > 0 ? (
            <View className="ml-1 bg-brand-500 rounded-full w-4 h-4 items-center justify-center">
              <RNText className="text-white text-xs leading-none">{activeFilterCount}</RNText>
            </View>
          ) : null}
        </Pressable>
      </View>

      <FilterSheet visible={filterSheetVisible} onClose={() => setFilterSheetVisible(false)} />

      <FlatList
        key={viewMode}
        data={isLoading ? [] : recipes}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 8 } : undefined}
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
        renderItem={({ item }) =>
          viewMode === 'grid' ? (
            <View className="flex-1">
              <RecipeCard
                recipe={item}
                tags={tagMap[item.id] ?? []}
                onPress={() => router.push(`/(stack)/recipes/${item.id}`)}
                onToggleFavorite={() => handleToggleFavorite(item.id, item.isFavorite)}
                compact
              />
            </View>
          ) : (
            <RecipeCard
              recipe={item}
              tags={tagMap[item.id] ?? []}
              onPress={() => router.push(`/(stack)/recipes/${item.id}`)}
              onToggleFavorite={() => handleToggleFavorite(item.id, item.isFavorite)}
            />
          )
        }
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
