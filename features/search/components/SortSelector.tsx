import React, { useState } from 'react'
import { ActionSheetIOS, Modal, Platform, Pressable, Text, View } from 'react-native'
import type { SortOption } from '../../../shared/types'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'favorite', label: 'Favourites first' },
  { value: 'quickest', label: 'Quickest to make' },
  { value: 'rated', label: 'Highest rated' },
  { value: 'lastCooked', label: 'Recently cooked' },
]

interface SortSelectorProps {
  value: SortOption
  onChange: (sort: SortOption) => void
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false)
  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Newest first'

  function handlePress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...SORT_OPTIONS.map((o) => o.label), 'Cancel'],
          cancelButtonIndex: SORT_OPTIONS.length,
        },
        (index) => {
          if (index < SORT_OPTIONS.length) {
            onChange(SORT_OPTIONS[index].value)
          }
        },
      )
    } else {
      setModalVisible(true)
    }
  }

  return (
    <>
      <Pressable onPress={handlePress} className="flex-row items-center">
        <Text className="text-base text-brand-500 font-semibold">{currentLabel}</Text>
        <Text className="text-brand-400 ml-1">▾</Text>
      </Pressable>

      {Platform.OS !== 'ios' ? (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/40"
            onPress={() => setModalVisible(false)}
          />
          <View className="bg-white rounded-t-2xl px-4 pt-4 pb-8">
            <Text className="text-base font-semibold text-gray-700 mb-3">Sort by</Text>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value)
                  setModalVisible(false)
                }}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
              >
                <Text
                  className={`text-base ${option.value === value ? 'font-bold text-brand-600' : 'text-gray-800'}`}
                >
                  {option.label}
                </Text>
                {option.value === value ? (
                  <Text className="text-brand-500">✓</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </Modal>
      ) : null}
    </>
  )
}
