import React from 'react'
import { Pressable, View, Text, PressableProps } from 'react-native'

export interface CheckboxProps extends Omit<PressableProps, 'onPress'> {
  checked: boolean
  onPress: () => void
  label?: string
  className?: string
  disabled?: boolean
}

export function Checkbox({
  checked,
  onPress,
  label,
  className = '',
  disabled = false,
  ...props
}: CheckboxProps) {
  return (
    <Pressable
      className={`flex-row items-center gap-2 ${disabled ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <View
        className={`w-5 h-5 rounded border-2 items-center justify-center ${
          checked ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-300'
        }`}
      >
        {checked ? <Text className="text-white text-xs font-bold">✓</Text> : null}
      </View>
      {label ? <Text className="text-base text-gray-800">{label}</Text> : null}
    </Pressable>
  )
}
