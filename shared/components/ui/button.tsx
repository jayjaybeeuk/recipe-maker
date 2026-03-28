import React from 'react'
import { Pressable, Text, PressableProps, StyleProp, ViewStyle } from 'react-native'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'default' | 'lg'

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  textClassName?: string
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  default: {
    container: 'bg-brand-500 active:bg-brand-600',
    text: 'text-white font-semibold',
  },
  outline: {
    container: 'border border-brand-500 bg-transparent active:bg-brand-50',
    text: 'text-brand-500 font-semibold',
  },
  ghost: {
    container: 'bg-transparent active:bg-brand-50',
    text: 'text-brand-500 font-semibold',
  },
  destructive: {
    container: 'bg-red-600 active:bg-red-700',
    text: 'text-white font-semibold',
  },
}

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-3 py-1.5 rounded-md', text: 'text-sm' },
  default: { container: 'px-4 py-2.5 rounded-lg', text: 'text-base' },
  lg: { container: 'px-6 py-3.5 rounded-xl', text: 'text-lg' },
}

export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  textClassName = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const v = variantClasses[variant]
  const s = sizeClasses[size]

  return (
    <Pressable
      className={`flex-row items-center justify-center ${v.container} ${s.container} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={`${v.text} ${s.text} ${textClassName}`}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
