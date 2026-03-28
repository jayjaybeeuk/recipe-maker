import React from 'react'
import { TextInput, TextInputProps, View, Text } from 'react-native'

export interface InputProps extends TextInputProps {
  className?: string
  error?: string
  label?: string
}

export function Input({ className = '', error, label, ...props }: InputProps) {
  return (
    <View className="w-full">
      {label ? <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text> : null}
      <TextInput
        className={`border rounded-lg px-3 py-2.5 text-base text-gray-900 bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error ? <Text className="text-sm text-red-500 mt-1">{error}</Text> : null}
    </View>
  )
}
