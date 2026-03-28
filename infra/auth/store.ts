import { create } from 'zustand'

interface AuthStore {
  session: null
  user: null
  isLoading: boolean
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}))
