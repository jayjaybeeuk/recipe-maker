import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useSearchStore } from '../../features/search/store'
import { useRecipeStore } from '../../features/recipes/store'
import { buildRecipeQuery } from '../../features/search/query-builder'
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '../../features/search/recent-searches'
import { SearchInput, FilterChips, SortSelector, FilterSheet } from '../../features/search/components'
import { EmptyState } from '../../shared/components/EmptyState'
import { RecipeCard } from '../../shared/components/RecipeCard'
import { recipeRepository, tagRepository } from '../../infra/db/repositories/index'
import { useDebounce } from '../../shared/utils/useDebounce'
import type { Recipe, Tag } from '../../shared/types'
import type { RecipeFilters } from '../../features/search/query-builder'

export default function SearchScreen() {
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

  const { toggleFavorite } = useRecipeStore()

  const [inputValue, setInputValue] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [results, setResults] = useState<Recipe[]>([])
  const [tagMap, setTagMap] = useState<Record<string, Tag[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [filterSheetVisible, setFilterSheetVisible] = useState(false)

  const debouncedSearchText = useDebounce(inputValue, 150)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Load recent searches on mount
  useEffect(() => {
    getRecentSearches().then(setRecentSearches)
  }, [])

  // Build and execute query whenever debounced search text or filters change
  useEffect(() => {
    const filters: RecipeFilters = {
      searchText: debouncedSearchText,
      cuisine,
      mealType,
      tags,
      isFavorite,
      maxTotalMinutes,
      sortBy,
    }
    const { sql, params } = buildRecipeQuery(filters)

    setIsLoading(true)
    recipeRepository
      .listRecipes({
        searchText: debouncedSearchText || undefined,
        cuisine: cuisine ?? undefined,
        mealType: mealType ?? undefined,
        tags: tags.length > 0 ? tags : undefined,
        isFavorite: isFavorite || undefined,
        maxTotalMinutes: maxTotalMinutes ?? undefined,
        sortBy,
      })
      .then(async (recipes) => {
        if (!isMounted.current) return
        setResults(recipes)
        const entries = await Promise.all(
          recipes.map(async (r) => {
            const recipeTags = await tagRepository.listByRecipeId(r.id)
            return [r.id, recipeTags] as const
          })
        )
        if (!isMounted.current) return
        setTagMap(Object.fromEntries(entries))
      })
      .catch(() => {
        if (isMounted.current) setResults([])
      })
      .finally(() => {
        if (isMounted.current) setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText, cuisine, mealType, tags, isFavorite, maxTotalMinutes, sortBy])

  const handleSubmit = useCallback(async () => {
    const term = debouncedSearchText.trim()
    if (term) {
      setSearchText(term)
      await addRecentSearch(term)
      const updated = await getRecentSearches()
      setRecentSearches(updated)
    }
  }, [debouncedSearchText, setSearchText])

  const handleSelectRecent = useCallback(
    async (term: string) => {
      setInputValue(term)
      setSearchText(term)
      await addRecentSearch(term)
      const updated = await getRecentSearches()
      setRecentSearches(updated)
    },
    [setSearchText]
  )

  const handleRemoveRecent = useCallback(async (term: string) => {
    await removeRecentSearch(term)
    const updated = await getRecentSearches()
    setRecentSearches(updated)
  }, [])

  const handleClearRecentAll = useCallback(async () => {
    await clearRecentSearches()
    setRecentSearches([])
  }, [])

  const handleToggleFavorite = useCallback(
    (id: string, current: boolean) => {
      toggleFavorite(id, !current)
      // optimistically update local results
      setResults((prev) =>
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

  const hasActiveFilters =
    debouncedSearchText.trim().length > 0 ||
    cuisine !== null ||
    mealType !== null ||
    tags.length > 0 ||
    isFavorite ||
    maxTotalMinutes !== null

  const activeFilterCount =
    (cuisine !== null ? 1 : 0) +
    (mealType !== null ? 1 : 0) +
    tags.length +
    (isFavorite ? 1 : 0) +
    (maxTotalMinutes !== null ? 1 : 0)

  const showRecentSearches =
    inputFocused && inputValue === '' && recentSearches.length > 0

  return (
    <View className="flex-1 bg-background">
      {/* Search input */}
      <View className="px-4 pt-4 pb-2">
        <SearchInput
          value={inputValue}
          onChangeText={setInputValue}
          onSubmit={handleSubmit}
          autoFocus
        />
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
        <Text className="text-sm text-gray-500 mr-2">Sort:</Text>
        <SortSelector value={sortBy} onChange={setSortBy} />
        <View className="flex-1" />
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          className="flex-row items-center ml-3"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-sm text-brand-500 font-semibold">Filters</Text>
          {activeFilterCount > 0 ? (
            <View className="ml-1 bg-brand-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-xs leading-none">{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <FilterSheet visible={filterSheetVisible} onClose={() => setFilterSheetVisible(false)} />

      {/* Recent searches panel */}
      {showRecentSearches ? (
        <View className="flex-1 px-4">
          {recentSearches.map((term) => (
            <View
              key={term}
              className="flex-row items-center py-3 border-b border-gray-100"
            >
              <Text className="text-gray-400 mr-3">🕐</Text>
              <Pressable className="flex-1" onPress={() => handleSelectRecent(term)}>
                <Text className="text-base text-gray-800">{term}</Text>
              </Pressable>
              <Pressable
                onPress={() => handleRemoveRecent(term)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-gray-400 text-base">×</Text>
              </Pressable>
            </View>
          ))}
          <Pressable onPress={handleClearRecentAll} className="py-3">
            <Text className="text-sm text-brand-500 font-semibold">Clear all</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={isLoading ? [] : results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            isLoading ? null : hasActiveFilters ? (
              <EmptyState
                title="No recipes found"
                message="Try adjusting your search or filters"
                action={{ label: 'Clear filters', onPress: clearAll }}
              />
            ) : (
              <EmptyState
                title="Start searching"
                message="Search by recipe name, ingredient, or tag"
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
          onScrollBeginDrag={() => setInputFocused(false)}
        />
      )}
    </View>
  )
}
