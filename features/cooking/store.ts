import { create } from 'zustand'
import { cookingSessionRepository } from '@infra/db/repositories'
import type { Recipe, Ingredient, Step, ActiveCookingSession, TimerState } from '@shared/types'

interface CookingStore {
  // State
  session: ActiveCookingSession | null
  recipe: Recipe | null
  ingredients: Ingredient[]
  steps: Step[]
  currentStepIndex: number
  scaleFactor: number
  timers: Record<string, TimerState>
  isLoading: boolean
  error: string | null

  // Actions
  startSession(recipeId: string, recipe: Recipe, ingredients: Ingredient[], steps: Step[]): Promise<void>
  toggleIngredient(ingredientId: string): Promise<void>
  toggleStep(stepId: string): Promise<void>
  setServingsOverride(servings: number): Promise<void>
  setCurrentStep(index: number): void
  startTimer(stepId: string, durationMinutes: number): void
  cancelTimer(stepId: string): void
  tickTimers(): void
  completeSession(): Promise<void>
  clearSession(): void
}

export const useCookingStore = create<CookingStore>((set, get) => ({
  session: null,
  recipe: null,
  ingredients: [],
  steps: [],
  currentStepIndex: 0,
  scaleFactor: 1.0,
  timers: {},
  isLoading: false,
  error: null,

  async startSession(recipeId, recipe, ingredients, steps) {
    set({ isLoading: true, error: null })
    try {
      const session = await cookingSessionRepository.createOrResume(recipeId)
      const scaleFactor =
        session.servingsOverride && recipe.servings
          ? session.servingsOverride / recipe.servings
          : 1.0
      set({ session, recipe, ingredients, steps, scaleFactor, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: String(err) })
    }
  },

  async toggleIngredient(ingredientId) {
    const { session } = get()
    if (!session) return
    const already = session.checkedIngredientIds.includes(ingredientId)
    const newIngredientIds = already
      ? session.checkedIngredientIds.filter((id) => id !== ingredientId)
      : [...session.checkedIngredientIds, ingredientId]
    await cookingSessionRepository.updateChecklist(session.id, newIngredientIds, session.checkedStepIds)
    set({ session: { ...session, checkedIngredientIds: newIngredientIds } })
  },

  async toggleStep(stepId) {
    const { session } = get()
    if (!session) return
    const already = session.checkedStepIds.includes(stepId)
    const newStepIds = already
      ? session.checkedStepIds.filter((id) => id !== stepId)
      : [...session.checkedStepIds, stepId]
    await cookingSessionRepository.updateChecklist(session.id, session.checkedIngredientIds, newStepIds)
    set({ session: { ...session, checkedStepIds: newStepIds } })
  },

  async setServingsOverride(servings) {
    const { session, recipe } = get()
    if (!session) return
    await cookingSessionRepository.updateServings(session.id, servings)
    const scaleFactor = recipe?.servings ? servings / recipe.servings : 1.0
    set({ session: { ...session, servingsOverride: servings }, scaleFactor })
  },

  setCurrentStep(index) {
    set({ currentStepIndex: index })
  },

  startTimer(stepId, durationMinutes) {
    const totalSeconds = durationMinutes * 60
    set((state) => ({
      timers: {
        ...state.timers,
        [stepId]: { stepId, totalSeconds, remainingSeconds: totalSeconds, running: true },
      },
    }))
  },

  cancelTimer(stepId) {
    set((state) => {
      const { [stepId]: _removed, ...rest } = state.timers
      return { timers: rest }
    })
  },

  tickTimers() {
    set((state) => {
      const updated: Record<string, TimerState> = {}
      for (const [id, timer] of Object.entries(state.timers)) {
        if (!timer.running) {
          updated[id] = timer
          continue
        }
        const remaining = timer.remainingSeconds - 1
        if (remaining <= 0) {
          updated[id] = {
            ...timer,
            remainingSeconds: 0,
            running: false,
            completedAt: new Date().toISOString(),
          }
        } else {
          updated[id] = { ...timer, remainingSeconds: remaining }
        }
      }
      return { timers: updated }
    })
  },

  async completeSession() {
    const { session } = get()
    if (!session) return
    await cookingSessionRepository.complete(session.id, session.recipeId)
    get().clearSession()
  },

  clearSession() {
    set({
      session: null,
      recipe: null,
      ingredients: [],
      steps: [],
      currentStepIndex: 0,
      scaleFactor: 1.0,
      timers: {},
      isLoading: false,
      error: null,
    })
  },
}))
