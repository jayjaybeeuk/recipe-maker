import React from 'react'
import { Text as RNText, TextProps } from 'react-native'

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'muted' | 'small'

export interface TypographyProps extends TextProps {
  variant?: TextVariant
  className?: string
  children?: React.ReactNode
}

const variantClasses: Record<TextVariant, string> = {
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-semibold text-gray-900',
  body: 'text-base text-gray-800',
  muted: 'text-base text-gray-500',
  small: 'text-sm text-gray-600',
}

export function Text({ variant = 'body', className = '', children, ...props }: TypographyProps) {
  return (
    <RNText className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </RNText>
  )
}
