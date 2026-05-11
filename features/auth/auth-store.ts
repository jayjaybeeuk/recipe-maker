import { Platform } from 'react-native'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

let SecureStore: typeof import('expo-secure-store') | null = null
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store')
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    await SecureStore!.setItemAsync(TOKEN_KEY, token)
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return await SecureStore!.getItemAsync(TOKEN_KEY)
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY)
  } else {
    await SecureStore!.deleteItemAsync(TOKEN_KEY)
  }
}

export async function saveUser(user: object): Promise<void> {
  const json = JSON.stringify(user)
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, json)
  } else {
    await SecureStore!.setItemAsync(USER_KEY, json)
  }
}

export async function getUser(): Promise<object | null> {
  let json: string | null
  if (Platform.OS === 'web') {
    json = localStorage.getItem(USER_KEY)
  } else {
    json = await SecureStore!.getItemAsync(USER_KEY)
  }
  return json ? JSON.parse(json) : null
}

export async function clearUser(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_KEY)
  } else {
    await SecureStore!.deleteItemAsync(USER_KEY)
  }
}
