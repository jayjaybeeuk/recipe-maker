import React from 'react'
import { View, ViewProps } from 'react-native'

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Separator({
  orientation = 'horizontal',
  className = '',
  ...props
}: SeparatorProps) {
  return (
    <View
      className={`bg-gray-200 ${
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'
      } ${className}`}
      {...props}
    />
  )
}
