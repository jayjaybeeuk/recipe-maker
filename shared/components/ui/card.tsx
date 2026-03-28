import React from 'react'
import { View, Text, ViewProps, TextProps } from 'react-native'

export interface CardProps extends ViewProps {
  className?: string
  children?: React.ReactNode
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-2xl shadow-sm border border-surface-muted ${className}`}
      {...props}
    >
      {children}
    </View>
  )
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  return (
    <View className={`px-4 pt-4 pb-2 ${className}`} {...props}>
      {children}
    </View>
  )
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  return (
    <View className={`px-4 py-2 ${className}`} {...props}>
      {children}
    </View>
  )
}

export function CardFooter({ className = '', children, ...props }: CardProps) {
  return (
    <View className={`px-4 pt-2 pb-4 flex-row items-center ${className}`} {...props}>
      {children}
    </View>
  )
}

export interface CardTextProps extends TextProps {
  className?: string
  children?: React.ReactNode
}

export function CardTitle({ className = '', children, ...props }: CardTextProps) {
  return (
    <Text className={`text-lg font-bold text-gray-900 ${className}`} {...props}>
      {children}
    </Text>
  )
}

export function CardDescription({ className = '', children, ...props }: CardTextProps) {
  return (
    <Text className={`text-sm text-gray-500 ${className}`} {...props}>
      {children}
    </Text>
  )
}
