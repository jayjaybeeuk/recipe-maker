import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

interface ImagePickerFieldProps {
  value: string | undefined
  onChange: (uri: string) => void
}

export function ImagePickerField({ value, onChange }: ImagePickerFieldProps) {
  async function handlePick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (!result.canceled && result.assets.length > 0) {
      onChange(result.assets[0].uri)
    }
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (!result.canceled && result.assets.length > 0) {
      onChange(result.assets[0].uri)
    }
  }

  return (
    <View className="w-full">
      <Text className="text-sm font-medium text-gray-700 mb-1">Photo</Text>
      <Pressable onPress={handlePick} className="w-full h-48 rounded-xl overflow-hidden bg-brand-100 items-center justify-center">
        {value ? (
          <Image source={{ uri: value }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="items-center gap-1">
            <Text className="text-3xl text-brand-400">📷</Text>
            <Text className="text-brand-500 font-medium">Tap to add photo</Text>
          </View>
        )}
      </Pressable>
      <View className="flex-row gap-2 mt-2">
        <Pressable onPress={handlePick} className="flex-1 py-2 border border-brand-300 rounded-lg items-center">
          <Text className="text-brand-600 text-sm font-medium">Choose from Library</Text>
        </Pressable>
        <Pressable onPress={handleCamera} className="flex-1 py-2 border border-brand-300 rounded-lg items-center">
          <Text className="text-brand-600 text-sm font-medium">Take Photo</Text>
        </Pressable>
      </View>
    </View>
  )
}
