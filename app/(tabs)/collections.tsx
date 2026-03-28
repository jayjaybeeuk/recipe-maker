import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Modal, Platform, TextInput, TouchableOpacity, View, Text as RNText } from 'react-native'
import { router } from 'expo-router'
import { collectionRepository } from '../../infra/db/repositories/index'
import { Card, CardContent, CardFooter } from '../../shared/components/ui/card'
import { Text } from '../../shared/components/ui/text'
import { Button } from '../../shared/components/ui/button'
import { EmptyState } from '../../shared/components/EmptyState'
import { Skeleton } from '../../shared/components/ui/skeleton'
import type { Collection } from '../../shared/types'

function SkeletonCollectionCard() {
  return (
    <View className="mb-3">
      <View className="bg-surface rounded-2xl border border-surface-muted px-4 py-3">
        <Skeleton className="h-6 w-3/4 mb-2 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </View>
    </View>
  )
}

export default function CollectionsScreen() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [androidModalVisible, setAndroidModalVisible] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const loadCollections = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await collectionRepository.listCollections()
      setCollections(list)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  const createCollection = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      await collectionRepository.createCollection(trimmed)
      await loadCollections()
    },
    [loadCollections]
  )

  const handleCreatePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'New Collection',
        'Enter a name for your collection',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: (name?: string) => {
              if (name) createCollection(name)
            },
          },
        ],
        'plain-text'
      )
    } else {
      setNewCollectionName('')
      setAndroidModalVisible(true)
    }
  }, [createCollection])

  const handleAndroidCreate = useCallback(async () => {
    setAndroidModalVisible(false)
    await createCollection(newCollectionName)
    setNewCollectionName('')
  }, [createCollection, newCollectionName])

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={isLoading ? [] : collections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          isLoading ? (
            <View>
              <SkeletonCollectionCard />
              <SkeletonCollectionCard />
              <SkeletonCollectionCard />
            </View>
          ) : (
            <EmptyState
              title="No Collections Yet"
              message="Group your favourite recipes into collections."
              action={{ label: 'Create Collection', onPress: handleCreatePress }}
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(stack)/collections/${item.id}`)}
            className="mb-3"
            activeOpacity={0.7}
          >
            <Card>
              <CardContent className="py-3">
                <Text variant="h3" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text variant="muted" numberOfLines={2} className="mt-1">
                    {item.description}
                  </Text>
                ) : null}
              </CardContent>
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Floating add button */}
      <TouchableOpacity
        onPress={handleCreatePress}
        className="absolute bottom-6 right-6 w-14 h-14 bg-brand-500 rounded-full items-center justify-center shadow-lg"
        accessibilityLabel="Create collection"
        accessibilityRole="button"
      >
        <RNText className="text-white text-3xl leading-none">+</RNText>
      </TouchableOpacity>

      {/* Android modal for collection name */}
      {Platform.OS !== 'ios' && (
        <Modal
          visible={androidModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAndroidModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-8">
            <View className="bg-surface rounded-2xl p-6 w-full">
              <Text variant="h3" className="mb-4">
                New Collection
              </Text>
              <TextInput
                placeholder="Collection name"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                autoFocus
                className="border border-surface-muted rounded-lg px-3 py-2 text-base mb-4"
              />
              <View className="flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={() => setAndroidModalVisible(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onPress={handleAndroidCreate}>
                  Create
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}
