import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { saveUser, getUser, clearUser, clearToken } from './auth-store'

export type User = {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

type AuthState = {
  user: User | null
  isLoading: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getUser()
      .then((stored) => {
        if (stored) setUser(stored as User)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const signIn = useCallback(() => {
    Alert.alert(
      'Coming Soon',
      'Google Sign-In coming soon - requires backend setup'
    )
    console.log('[Auth] signIn called — stub, no backend yet')
  }, [])

  const signOut = useCallback(async () => {
    await clearUser()
    await clearToken()
    setUser(null)
    console.log('[Auth] signOut called — user cleared')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
