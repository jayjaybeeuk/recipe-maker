import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function LoginScreen() {
  const router = useRouter()

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Coming Soon',
      'Google Sign-In coming soon - requires backend setup'
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="restaurant-outline" size={64} color="#E85D3A" />
        <Text style={styles.title}>Recipe Maker</Text>
        <Text style={styles.subtitle}>Save & organize your favourite recipes</Text>
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipLink}
        onPress={() => router.back()}
      >
        <Text style={styles.skipText}>Continue without signing in</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: '#fff',
    color: '#4285F4',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipLink: {
    marginTop: 24,
    padding: 12,
  },
  skipText: {
    color: '#4285F4',
    fontSize: 14,
  },
})
