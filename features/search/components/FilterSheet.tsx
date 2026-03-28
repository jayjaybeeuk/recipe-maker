import React, { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSearchStore } from '../store'
import { Checkbox } from '../../../shared/components/ui/checkbox'
import { recipeRepository } from '../../../infra/db/repositories/index'

interface FilterSheetProps {
  visible: boolean
  onClose: () => void
}

const TIME_PRESETS = [
  { label: 'Under 15 min', value: 15 },
  { label: 'Under 30 min', value: 30 },
  { label: 'Under 60 min', value: 60 },
  { label: 'Any time', value: null },
] as const

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const {
    cuisine,
    mealType,
    isFavorite,
    maxTotalMinutes,
    setCuisine,
    setMealType,
    setIsFavorite,
    setMaxTotalMinutes,
  } = useSearchStore()

  const [cuisines, setCuisines] = useState<string[]>([])
  const [mealTypes, setMealTypes] = useState<string[]>([])

  useEffect(() => {
    if (!visible) return
    recipeRepository.getDistinctValues('cuisine').then(setCuisines).catch(() => setCuisines([]))
    recipeRepository.getDistinctValues('meal_type').then(setMealTypes).catch(() => setMealTypes([]))
  }, [visible])

  const handleCuisinePress = useCallback(
    (value: string) => {
      setCuisine(cuisine === value ? null : value)
    },
    [cuisine, setCuisine]
  )

  const handleMealTypePress = useCallback(
    (value: string) => {
      setMealType(mealType === value ? null : value)
    },
    [mealType, setMealType]
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
      />
      <View className="bg-white rounded-t-2xl max-h-[80%]">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <Text className="text-lg font-semibold text-gray-900">Filters</Text>
          <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-gray-500 text-base">×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Cuisine section */}
          {cuisines.length > 0 ? (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Cuisine
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {cuisines.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => handleCuisinePress(c)}
                    className={`px-3 py-1.5 rounded-full border ${
                      cuisine === c
                        ? 'bg-brand-500 border-brand-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        cuisine === c ? 'text-white font-medium' : 'text-gray-700'
                      }`}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Meal type section */}
          {mealTypes.length > 0 ? (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Meal Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {mealTypes.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => handleMealTypePress(m)}
                    className={`px-3 py-1.5 rounded-full border ${
                      mealType === m
                        ? 'bg-brand-500 border-brand-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        mealType === m ? 'text-white font-medium' : 'text-gray-700'
                      }`}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Quick filter / time section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Cooking Time
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TIME_PRESETS.map((preset) => {
                const isActive = maxTotalMinutes === preset.value
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => setMaxTotalMinutes(preset.value)}
                    className={`px-3 py-1.5 rounded-full border ${
                      isActive
                        ? 'bg-brand-500 border-brand-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isActive ? 'text-white font-medium' : 'text-gray-700'
                      }`}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Favourites toggle */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-base text-gray-800">Favourites only</Text>
            <Checkbox
              checked={isFavorite}
              onPress={() => setIsFavorite(!isFavorite)}
            />
          </View>
        </ScrollView>

        {/* Close / Apply button */}
        <View className="px-4 pb-8 pt-2 border-t border-gray-100">
          <Pressable
            onPress={onClose}
            className="bg-brand-500 rounded-xl py-3 items-center"
          >
            <Text className="text-white font-semibold text-base">Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
