import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../features/auth/AuthContext'

export default function SettingsScreen() {
  const { user, signIn, signOut } = useAuth()
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.section}>
        {user ? (
          <>
            <Text style={styles.label}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <TouchableOpacity style={styles.button} onPress={signOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Not signed in</Text>
            <TouchableOpacity
              style={[styles.button, styles.signInButton]}
              onPress={() => router.push('/(stack)/auth/login')}
            >
              <Text style={[styles.buttonText, styles.signInText]}>Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  section: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#4285F4',
  },
  signInText: {
    color: '#fff',
  },
})
