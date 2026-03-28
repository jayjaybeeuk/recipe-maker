import { create } from 'zustand'
import type {
  Recipe,
  Ingredient,
  Step,
  Tag,
  RecipeQuery,
  CreateRecipeInput,
  UpdateRecipeInput,
} from '../../shared/types'
import {
  recipeRepository,
  ingredientRepository,
  stepRepository,
  tagRepository,
} from '../../infra/db/repositories/index'

interface RecipeStore {
  recipes: Recipe[]
  selectedRecipe: Recipe | null
  ingredients: Ingredient[]
  steps: Step[]
  tags: Tag[]
  isLoading: boolean
  error: string | null

  loadRecipes(query?: RecipeQuery): Promise<void>
  loadRecipeById(id: string): Promise<void>
  createRecipe(input: CreateRecipeInput): Promise<Recipe>
  updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe>
  deleteRecipe(id: string): Promise<void>
  toggleFavorite(id: string, isFavorite: boolean): Promise<void>
  clearSelected(): void
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  selectedRecipe: null,
  ingredients: [],
  steps: [],
  tags: [],
  isLoading: false,
  error: null,

  async loadRecipes(query?: RecipeQuery): Promise<void> {
    set({ isLoading: true, error: null })
    try {
      const recipes = await recipeRepository.listRecipes(query ?? {})
      set({ recipes })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load recipes' })
    } finally {
      set({ isLoading: false })
    }
  },

  async loadRecipeById(id: string): Promise<void> {
    set({ isLoading: true, error: null })
    try {
      const [recipe, ingredients, steps, tags] = await Promise.all([
        recipeRepository.getRecipeById(id),
        ingredientRepository.listByRecipeId(id),
        stepRepository.listByRecipeId(id),
        tagRepository.listByRecipeId(id),
      ])
      set({ selectedRecipe: recipe, ingredients, steps, tags })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load recipe' })
    } finally {
      set({ isLoading: false })
    }
  },

  async createRecipe(input: CreateRecipeInput): Promise<Recipe> {
    set({ error: null })
    try {
      const recipe = await recipeRepository.createRecipe(input)
      await get().loadRecipes()
      return recipe
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create recipe'
      set({ error: message })
      throw new Error(message)
    }
  },

  async updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    set({ error: null })
    try {
      const recipe = await recipeRepository.updateRecipe(id, input)
      await get().loadRecipes()
      return recipe
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update recipe'
      set({ error: message })
      throw new Error(message)
    }
  },

  async deleteRecipe(id: string): Promise<void> {
    set({ error: null })
    try {
      await recipeRepository.deleteRecipe(id)
      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
        selectedRecipe: state.selectedRecipe?.id === id ? null : state.selectedRecipe,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete recipe'
      set({ error: message })
      throw new Error(message)
    }
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    set({ error: null })
    try {
      await recipeRepository.toggleFavorite(id, isFavorite)
      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === id ? { ...r, isFavorite } : r
        ),
        selectedRecipe:
          state.selectedRecipe?.id === id
            ? { ...state.selectedRecipe, isFavorite }
            : state.selectedRecipe,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle favorite'
      set({ error: message })
      throw new Error(message)
    }
  },

  clearSelected(): void {
    set({ selectedRecipe: null, ingredients: [], steps: [], tags: [] })
  },
}))
