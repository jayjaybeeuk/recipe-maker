import { useEffect, useState } from 'react'
import { Platform, View, ActivityIndicator } from 'react-native'
import { checkBrowserCompatibility } from '../utils/checkBrowserCompatibility'
import UnsupportedBrowserScreen from './UnsupportedBrowserScreen'

type Props = {
  children: React.ReactNode
}

export default function BrowserCompatibilityGate({ children }: Props) {
  const [status, setStatus] = useState<'checking' | 'supported' | 'unsupported'>(
    Platform.OS !== 'web' ? 'supported' : 'checking'
  )

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const result = checkBrowserCompatibility()
    setStatus(result.supported ? 'supported' : 'unsupported')
  }, [])

  if (status === 'checking') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (status === 'unsupported') {
    return <UnsupportedBrowserScreen />
  }

  return <>{children}</>
}
