import React from 'react'
import { Image, Pressable, View } from 'react-native'
import type { Recipe, Tag } from '../types'
import { Card, CardContent, CardFooter } from './ui/card'
import { Badge } from './ui/badge'
import { Text } from './ui/text'
import { Button } from './ui/button'

export interface RecipeCardProps {
  recipe: Recipe
  tags: Tag[]
  onPress: () => void
  onToggleFavorite: () => void
}

export function RecipeCard({ recipe, tags, onPress, onToggleFavorite }: RecipeCardProps) {
  const visibleTags = tags.slice(0, 3)

  const totalMinutes =
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
  const timeLabel =
    totalMinutes > 0
      ? totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60 > 0 ? `${totalMinutes % 60}m` : ''}`.trim()
        : `${totalMinutes}m`
      : null

  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card>
        {recipe.imageUri ? (
          <Image
            source={{ uri: recipe.imageUri }}
            className="w-full h-40 rounded-t-2xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-40 bg-brand-100 rounded-t-2xl items-center justify-center">
            <Text variant="h1" className="text-brand-300">
              {recipe.title.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <CardContent className="pt-3">
          <View className="flex-row items-start justify-between">
            <Text variant="h3" className="flex-1 mr-2" numberOfLines={2}>
              {recipe.title}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={onToggleFavorite}
              className="min-w-[44px] min-h-[44px] items-center justify-center p-0"
            >
              <Text className={`text-2xl ${recipe.isFavorite ? 'text-brand-500' : 'text-gray-300'}`}>
                {recipe.isFavorite ? '★' : '☆'}
              </Text>
            </Button>
          </View>
        </CardContent>

        <CardFooter className="flex-row flex-wrap gap-1 justify-between items-center">
          <View className="flex-row flex-wrap gap-1 flex-1">
            {visibleTags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </View>
          {timeLabel && (
            <Text variant="small" className="text-gray-500 ml-2">
              {'⏱ ' + timeLabel}
            </Text>
          )}
        </CardFooter>
      </Card>
    </Pressable>
  )
}
