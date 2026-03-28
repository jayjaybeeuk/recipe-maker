import React, { useEffect, useRef } from 'react'
import { Animated, View, ViewProps } from 'react-native'

export interface SkeletonProps extends ViewProps {
  className?: string
  width?: number | string
  height?: number | string
}

export function Skeleton({ className = '', style, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[{ opacity }, style]}
      className={`bg-surface-muted rounded-md ${className}`}
      {...props}
    />
  )
}
