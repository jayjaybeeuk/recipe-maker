import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { Platform } from 'react-native'
import { saveUser, getUser, clearUser, saveToken, clearToken } from './auth-store'

WebBrowser.maybeCompleteAuthSession()

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

  const redirectUri = makeRedirectUri({
    scheme: 'recipemaker',
    path: 'auth',
  })

  console.log('[Auth] redirectUri:', redirectUri, 'platform:', Platform.OS)

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: Platform.OS === 'web' ? redirectUri : undefined,
  })

  useEffect(() => {
    getUser()
      .then((stored) => {
        if (stored) setUser(stored as User)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    console.log('[Auth] response changed:', response?.type, response)
    if (response?.type === 'success') {
      const { authentication } = response
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken)
      }
    }
  }, [response])

  const fetchUserInfo = async (accessToken: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const info = await res.json()
      const mappedUser: User = {
        id: info.sub,
        email: info.email,
        name: info.name,
        avatarUrl: info.picture,
      }
      await saveUser(mappedUser)
      await saveToken(accessToken)
      setUser(mappedUser)
      console.log('[Auth] signIn success', mappedUser.email)
    } catch (err) {
      console.error('[Auth] Failed to fetch user info', err)
    }
  }

  const signIn = useCallback(() => {
    promptAsync()
  }, [promptAsync])

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
