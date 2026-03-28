import React from 'react'
import { View, Text, ViewProps } from 'react-native'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant
  className?: string
  textClassName?: string
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-brand-500', text: 'text-white' },
  secondary: { container: 'bg-brand-100', text: 'text-brand-800' },
  outline: { container: 'border border-brand-500 bg-transparent', text: 'text-brand-600' },
  destructive: { container: 'bg-red-600', text: 'text-white' },
}

export function Badge({
  variant = 'default',
  className = '',
  textClassName = '',
  children,
  ...props
}: BadgeProps) {
  const v = variantClasses[variant]
  return (
    <View
      className={`inline-flex px-2 py-0.5 rounded-full ${v.container} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-medium ${v.text} ${textClassName}`}>{children}</Text>
    </View>
  )
}
