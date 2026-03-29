// Web stubs — SQLite is not available on web.
// All repository methods return empty/no-op results so the UI can render during web development.

const noop = async () => {}
const emptyList = async () => []
const emptyNull = async () => null

export const recipeRepository = {
  listRecipes: emptyList,
  getRecipeById: emptyNull,
  createRecipe: async () => { throw new Error('Not available on web') },
  updateRecipe: async () => { throw new Error('Not available on web') },
  deleteRecipe: noop,
  toggleFavorite: noop,
  getDistinctValues: emptyList,
}

export const ingredientRepository = {
  listByRecipeId: emptyList,
  replaceForRecipe: noop,
}

export const stepRepository = {
  listByRecipeId: emptyList,
  replaceForRecipe: noop,
}

export const tagRepository = {
  listByRecipeId: emptyList,
  findOrCreate: async () => { throw new Error('Not available on web') },
  reconcileForRecipe: emptyList,
}

export const collectionRepository = {
  listCollections: emptyList,
  createCollection: async () => { throw new Error('Not available on web') },
  addRecipeToCollection: noop,
  removeRecipeFromCollection: noop,
  listRecipesInCollection: emptyList,
  deleteCollection: noop,
}

export const syncQueueRepository = {
  enqueue: noop,
  dequeuePending: emptyList,
  markFailed: noop,
  clearEntry: noop,
}

export const cookingSessionRepository = {
  createOrResume: async () => { throw new Error('Not available on web') },
  updateChecklist: noop,
  updateServings: noop,
  complete: noop,
  getActiveForRecipe: emptyNull,
}

