import { Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Recipe Detail: {id}</Text>
    </View>
  )
}
