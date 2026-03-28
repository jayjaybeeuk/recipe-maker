import React from 'react'
import { Image, View } from 'react-native'
import { Text } from './ui/text'

export interface HeroImageProps {
  uri: string | null
  title: string
}

export function HeroImage({ uri, title }: HeroImageProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        className="w-full h-56"
        resizeMode="cover"
      />
    )
  }

  return (
    <View className="w-full h-56 bg-brand-100 items-center justify-center">
      <Text variant="h1" className="text-brand-300 text-6xl">
        {title.charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}
