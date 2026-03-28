import { create } from 'zustand'
import { SortOption } from '../../shared/types'

interface SearchStore {
  searchText: string
  cuisine: string | null
  mealType: string | null
  tags: string[]
  isFavorite: boolean
  maxTotalMinutes: number | null
  sortBy: SortOption
  setSearchText: (searchText: string) => void
  setCuisine: (cuisine: string | null) => void
  setMealType: (mealType: string | null) => void
  toggleTag: (tag: string) => void
  setIsFavorite: (isFavorite: boolean) => void
  setMaxTotalMinutes: (maxTotalMinutes: number | null) => void
  setSortBy: (sortBy: SortOption) => void
  clearAll: () => void
}

const initialState = {
  searchText: '',
  cuisine: null,
  mealType: null,
  tags: [],
  isFavorite: false,
  maxTotalMinutes: null,
  sortBy: 'newest' as SortOption,
}

export const useSearchStore = create<SearchStore>((set) => ({
  ...initialState,
  setSearchText: (searchText) => set({ searchText }),
  setCuisine: (cuisine) => set({ cuisine }),
  setMealType: (mealType) => set({ mealType }),
  toggleTag: (tag) =>
    set((state) => ({
      tags: state.tags.includes(tag) ? state.tags.filter((t) => t !== tag) : [...state.tags, tag],
    })),
  setIsFavorite: (isFavorite) => set({ isFavorite }),
  setMaxTotalMinutes: (maxTotalMinutes) => set({ maxTotalMinutes }),
  setSortBy: (sortBy) => set({ sortBy }),
  clearAll: () => set(initialState),
}))
