import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'recent_searches'
const MAX_RECENT = 10

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function addRecentSearch(term: string): Promise<void> {
  const trimmed = term.trim().toLowerCase()
  if (!trimmed) return
  try {
    const current = await getRecentSearches()
    const deduped = [trimmed, ...current.filter((t) => t !== trimmed)]
    const truncated = deduped.slice(0, MAX_RECENT)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(truncated))
  } catch {
    // silently ignore storage errors
  }
}

export async function removeRecentSearch(term: string): Promise<void> {
  try {
    const current = await getRecentSearches()
    const updated = current.filter((t) => t !== term)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // silently ignore storage errors
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch {
    // silently ignore storage errors
  }
}
