import React from 'react'
import { View } from 'react-native'
import { Text } from './ui/text'
import { Button } from './ui/button'

export interface EmptyStateProps {
  title: string
  message: string
  action?: {
    label: string
    onPress: () => void
  }
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text variant="h2" className="text-center mb-2">
        {title}
      </Text>
      <Text variant="muted" className="text-center mb-6">
        {message}
      </Text>
      {action && (
        <Button onPress={action.onPress}>{action.label}</Button>
      )}
    </View>
  )
}
