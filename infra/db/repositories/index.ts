export { SyncQueueRepository } from './sync-queue-repository'
export { IngredientRepository } from './ingredient-repository'
export { StepRepository } from './step-repository'
export { TagRepository } from './tag-repository'
export { RecipeRepository } from './recipe-repository'
export { CollectionRepository } from './collection-repository'
export { CookingSessionRepository } from './cooking-session-repository'

import { SyncQueueRepository } from './sync-queue-repository'
import { IngredientRepository } from './ingredient-repository'
import { StepRepository } from './step-repository'
import { TagRepository } from './tag-repository'
import { RecipeRepository } from './recipe-repository'
import { CollectionRepository } from './collection-repository'
import { CookingSessionRepository } from './cooking-session-repository'

export const syncQueueRepository = new SyncQueueRepository()
export const ingredientRepository = new IngredientRepository()
export const stepRepository = new StepRepository()
export const tagRepository = new TagRepository()
export const recipeRepository = new RecipeRepository(
  ingredientRepository,
  stepRepository,
  tagRepository,
  syncQueueRepository
)
export const collectionRepository = new CollectionRepository()
export const cookingSessionRepository = new CookingSessionRepository()
