export type SortOption = 'newest' | 'updated' | 'favorite' | 'quickest' | 'rated' | 'lastCooked'

export interface Recipe {
  id: string
  title: string
  isFavorite: boolean
  syncStatus: 'pending' | 'synced' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface ActiveCookingSession {
  id: string
  recipeId: string
  checkedIngredientIds: string[]
  checkedStepIds: string[]
  startedAt: string
  updatedAt: string
}

export interface TimerState {
  stepId: string
  totalSeconds: number
  remainingSeconds: number
  running: boolean
}
