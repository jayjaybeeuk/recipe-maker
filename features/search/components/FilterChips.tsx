import React from 'react'
import { ScrollView, Pressable, Text, View } from 'react-native'
import type { RecipeFilters } from '../query-builder'

interface FilterChipsProps {
  filters: RecipeFilters
  onRemoveCuisine: () => void
  onRemoveMealType: () => void
  onRemoveTag: (tag: string) => void
  onClearFavorite: () => void
  onClearTime: () => void
  onClearAll: () => void
}

interface ChipProps {
  label: string
  onRemove: () => void
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <View className="flex-row items-center bg-brand-100 rounded-full px-3 py-1 mr-2">
      <Text className="text-sm text-brand-800 mr-1">{label}</Text>
      <Pressable
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text className="text-sm text-brand-600">×</Text>
      </Pressable>
    </View>
  )
}

export function FilterChips({
  filters,
  onRemoveCuisine,
  onRemoveMealType,
  onRemoveTag,
  onClearFavorite,
  onClearTime,
  onClearAll,
}: FilterChipsProps) {
  const activeCount =
    (filters.cuisine ? 1 : 0) +
    (filters.mealType ? 1 : 0) +
    filters.tags.length +
    (filters.isFavorite ? 1 : 0) +
    (filters.maxTotalMinutes !== null ? 1 : 0)

  if (activeCount === 0) return null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 0, alignItems: 'center' }}
      className="py-2"
    >
      {filters.cuisine ? (
        <Chip label={filters.cuisine} onRemove={onRemoveCuisine} />
      ) : null}
      {filters.mealType ? (
        <Chip label={filters.mealType} onRemove={onRemoveMealType} />
      ) : null}
      {filters.tags.map((tag) => (
        <Chip key={tag} label={tag} onRemove={() => onRemoveTag(tag)} />
      ))}
      {filters.isFavorite ? (
        <Chip label="Favourites" onRemove={onClearFavorite} />
      ) : null}
      {filters.maxTotalMinutes !== null ? (
        <Chip label={`≤ ${filters.maxTotalMinutes}min`} onRemove={onClearTime} />
      ) : null}
      {activeCount >= 2 ? (
        <Pressable onPress={onClearAll} className="px-2 py-1">
          <Text className="text-sm text-brand-500 font-semibold">Clear all</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  )
}
