import React from 'react'
import { View, TextInput, Pressable, Text } from 'react-native'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search recipes…',
  autoFocus = false,
}: SearchInputProps) {
  return (
    <View className="flex-row items-center border border-gray-300 rounded-lg bg-white px-3">
      <TextInput
        className="flex-1 py-2.5 text-base text-gray-900"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-gray-400 text-lg">×</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
