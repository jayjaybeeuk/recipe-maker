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
  listAll: emptyList,
  findOrCreate: async () => { throw new Error('Not available on web') },
  syncForRecipe: noop,
}

export const collectionRepository = {
  listAll: emptyList,
  getById: emptyNull,
  create: async () => { throw new Error('Not available on web') },
  update: async () => { throw new Error('Not available on web') },
  delete: noop,
  addRecipe: noop,
  removeRecipe: noop,
}

export const syncQueueRepository = {
  enqueue: noop,
  listPending: emptyList,
  markFailed: noop,
  delete: noop,
}

