import { create } from 'zustand'
import { Recipe } from '../../shared/types'

interface RecipeStore {
  recipes: Recipe[]
  selectedRecipeId: string | null
  isLoading: boolean
  error: string | null
  setRecipes: (recipes: Recipe[]) => void
  setSelectedRecipe: (id: string | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  recipes: [],
  selectedRecipeId: null,
  isLoading: false,
  error: null,
  setRecipes: (recipes) => set({ recipes }),
  setSelectedRecipe: (selectedRecipeId) => set({ selectedRecipeId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
