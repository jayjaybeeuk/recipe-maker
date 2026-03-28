import '../global.css'

import { useEffect, useState } from 'react'
import { Platform, View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { runMigrations } from '../infra/db/migration-runner'

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(Platform.OS === 'web')

  useEffect(() => {
    if (Platform.OS === 'web') return
    runMigrations()
      .then(() => setDbReady(true))
      .catch((err: unknown) => {
        throw new Error(`Migration failed: ${String(err)}`)
      })
  }, [])

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(stack)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
