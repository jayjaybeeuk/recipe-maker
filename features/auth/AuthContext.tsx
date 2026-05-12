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

  const redirectUri = Platform.OS === 'web'
    ? window.location.origin
    : makeRedirectUri({ scheme: 'recipemaker' })

  console.log('[Auth] redirectUri:', redirectUri)

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  })

  // Load stored user on mount, and check for OAuth redirect hash on web
  useEffect(() => {
    const init = async () => {
      // Check if we're returning from a Google OAuth redirect (token in URL hash)
      if (Platform.OS === 'web' && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = params.get('access_token')
        if (accessToken) {
          console.log('[Auth] Found access_token in URL hash, fetching user info')
          // Clean up the URL
          window.history.replaceState(null, '', window.location.pathname)
          await fetchUserInfo(accessToken)
          setIsLoading(false)
          return
        }
      }

      const stored = await getUser()
      if (stored) setUser(stored as User)
      setIsLoading(false)
    }
    init()
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
