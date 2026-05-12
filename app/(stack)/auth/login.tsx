import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/features/auth/AuthContext'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, signOut, user } = useAuth()

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="restaurant-outline" size={64} color="#E85D3A" />
          <Text style={styles.title}>Recipe Maker</Text>
        </View>

        <View style={styles.userCard}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => router.back()}
        >
          <Text style={styles.skipText}>Back to recipes</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="restaurant-outline" size={64} color="#E85D3A" />
        <Text style={styles.title}>Recipe Maker</Text>
        <Text style={styles.subtitle}>Save & organize your favourite recipes</Text>
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={signIn}>
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
  userCard: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
})
