// Web localStorage-backed repositories — drop-in replacement for SQLite on web.
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeQuery,
  Ingredient,
  IngredientInput,
  Step,
  StepInput,
  Tag,
  Collection,
  SyncQueueEntry,
  ActiveCookingSession,
} from '../../../shared/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const KEYS = {
  recipes: 'recipe-maker:recipes',
  ingredients: 'recipe-maker:ingredients',
  steps: 'recipe-maker:steps',
  tags: 'recipe-maker:tags',
  recipeTags: 'recipe-maker:recipe-tags',
  collections: 'recipe-maker:collections',
  collectionRecipes: 'recipe-maker:collection-recipes',
  syncQueue: 'recipe-maker:sync-queue',
  cookingSessions: 'recipe-maker:cooking-sessions',
} as const

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ---------------------------------------------------------------------------
// Recipe repository
// ---------------------------------------------------------------------------

export const recipeRepository = {
  async createRecipe(input: CreateRecipeInput): Promise<Recipe> {
    const id = uuid()
    const now = new Date().toISOString()

    const searchText = [input.title, input.description, input.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    // Create ingredients & steps first to build search fields
    const ingredients = await ingredientRepository.replaceForRecipe(id, input.ingredients)
    await stepRepository.replaceForRecipe(id, input.steps)
    const tags = await tagRepository.reconcileForRecipe(id, input.tags)

    const searchIngredients = ingredients.map((i) => i.name).join(' ').toLowerCase()
    const searchTags = tags.map((t) => t.name).join(' ').toLowerCase()

    const recipe: Recipe = {
      id,
      title: input.title,
      description: input.description ?? null,
      prepTimeMinutes: input.prepTimeMinutes ?? null,
      cookTimeMinutes: input.cookTimeMinutes ?? null,
      servings: input.servings ?? null,
      difficulty: input.difficulty ?? null,
      cuisine: input.cuisine ?? null,
      mealType: input.mealType ?? null,
      sourceUrl: input.sourceUrl ?? null,
      notes: input.notes ?? null,
      rating: input.rating ?? null,
      isFavorite: input.isFavorite ?? false,
      imageUri: input.imageUri ?? null,
      createdAt: now,
      updatedAt: now,
      lastCookedAt: null,
      deletedAt: null,
      syncStatus: 'pending',
      searchText,
      searchIngredients,
      searchTags,
    }

    const recipes = load<Recipe>(KEYS.recipes)
    recipes.push(recipe)
    save(KEYS.recipes, recipes)

    await syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'create',
      payload: JSON.stringify({ ...input, id }),
    })

    return recipe
  },

  async updateRecipe(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    const recipes = load<Recipe>(KEYS.recipes)
    const idx = recipes.findIndex((r) => r.id === id && !r.deletedAt)
    if (idx === -1) throw new Error(`Recipe ${id} not found`)

    const existing = recipes[idx]
    const now = new Date().toISOString()

    const merged = { ...existing, ...input }
    const searchText = [merged.title, merged.description, merged.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    let searchIngredients = existing.searchIngredients
    let searchTags = existing.searchTags

    if (input.ingredients !== undefined) {
      const ingredients = await ingredientRepository.replaceForRecipe(id, input.ingredients)
      searchIngredients = ingredients.map((i) => i.name).join(' ').toLowerCase()
    }
    if (input.steps !== undefined) {
      await stepRepository.replaceForRecipe(id, input.steps)
    }
    if (input.tags !== undefined) {
      const tags = await tagRepository.reconcileForRecipe(id, input.tags)
      searchTags = tags.map((t) => t.name).join(' ').toLowerCase()
    }

    const updated: Recipe = {
      ...existing,
      title: merged.title,
      description: merged.description ?? null,
      prepTimeMinutes: merged.prepTimeMinutes ?? null,
      cookTimeMinutes: merged.cookTimeMinutes ?? null,
      servings: merged.servings ?? null,
      difficulty: merged.difficulty ?? null,
      cuisine: merged.cuisine ?? null,
      mealType: merged.mealType ?? null,
      sourceUrl: merged.sourceUrl ?? null,
      notes: merged.notes ?? null,
      rating: merged.rating ?? null,
      isFavorite: merged.isFavorite ?? existing.isFavorite,
      imageUri: merged.imageUri ?? null,
      updatedAt: now,
      syncStatus: 'pending',
      searchText,
      searchIngredients,
      searchTags,
    }

    recipes[idx] = updated
    save(KEYS.recipes, recipes)

    await syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'update',
      payload: JSON.stringify({ id, ...input }),
    })

    return updated
  },

  async deleteRecipe(id: string): Promise<void> {
    const recipes = load<Recipe>(KEYS.recipes)
    const now = new Date().toISOString()
    const idx = recipes.findIndex((r) => r.id === id)
    if (idx !== -1) {
      recipes[idx] = { ...recipes[idx], deletedAt: now, updatedAt: now, syncStatus: 'pending' }
      save(KEYS.recipes, recipes)
    }
    await syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'delete',
      payload: JSON.stringify({ id }),
    })
  },

  async getRecipeById(id: string): Promise<Recipe | null> {
    const recipes = load<Recipe>(KEYS.recipes)
    return recipes.find((r) => r.id === id && !r.deletedAt) ?? null
  },

  async listRecipes(query: RecipeQuery = {}): Promise<Recipe[]> {
    let recipes = load<Recipe>(KEYS.recipes).filter((r) => !r.deletedAt)

    if (query.searchText) {
      const term = query.searchText.toLowerCase()
      recipes = recipes.filter(
        (r) =>
          r.searchText.includes(term) ||
          r.searchIngredients.includes(term) ||
          r.searchTags.includes(term)
      )
    }
    if (query.cuisine) recipes = recipes.filter((r) => r.cuisine === query.cuisine)
    if (query.mealType) recipes = recipes.filter((r) => r.mealType === query.mealType)
    if (query.isFavorite !== undefined) recipes = recipes.filter((r) => r.isFavorite === query.isFavorite)
    if (query.maxTotalMinutes !== undefined) {
      recipes = recipes.filter(
        (r) => (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0) <= query.maxTotalMinutes!
      )
    }

    // Sort
    const sortBy = query.sortBy ?? 'newest'
    const cmp = (a: Recipe, b: Recipe): number => {
      switch (sortBy) {
        case 'newest': return b.createdAt.localeCompare(a.createdAt)
        case 'updated': return b.updatedAt.localeCompare(a.updatedAt)
        case 'favorite': return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt)
        case 'quickest': return ((a.prepTimeMinutes ?? 0) + (a.cookTimeMinutes ?? 0)) - ((b.prepTimeMinutes ?? 0) + (b.cookTimeMinutes ?? 0))
        case 'rated': return (b.rating ?? 0) - (a.rating ?? 0)
        case 'lastCooked': return (b.lastCookedAt ?? '').localeCompare(a.lastCookedAt ?? '')
        default: return b.createdAt.localeCompare(a.createdAt)
      }
    }
    recipes.sort(cmp)

    const offset = query.offset ?? 0
    const limit = query.limit ?? 100
    return recipes.slice(offset, offset + limit)
  },

  async getDistinctValues(column: 'cuisine' | 'meal_type'): Promise<string[]> {
    const recipes = load<Recipe>(KEYS.recipes).filter((r) => !r.deletedAt)
    const key = column === 'meal_type' ? 'mealType' : 'cuisine'
    const values = new Set<string>()
    for (const r of recipes) {
      const v = r[key]
      if (v) values.add(v)
    }
    return Array.from(values).sort()
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const recipes = load<Recipe>(KEYS.recipes)
    const now = new Date().toISOString()
    const idx = recipes.findIndex((r) => r.id === id)
    if (idx !== -1) {
      recipes[idx] = { ...recipes[idx], isFavorite, updatedAt: now, syncStatus: 'pending' }
      save(KEYS.recipes, recipes)
    }
    await syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: id,
      operation: 'update',
      payload: JSON.stringify({ id, isFavorite }),
    })
  },
}

// ---------------------------------------------------------------------------
// Ingredient repository
// ---------------------------------------------------------------------------

export const ingredientRepository = {
  async replaceForRecipe(recipeId: string, ingredients: IngredientInput[]): Promise<Ingredient[]> {
    const all = load<Ingredient>(KEYS.ingredients).filter((i) => i.recipeId !== recipeId)
    const created: Ingredient[] = ingredients.map((input, idx) => ({
      id: uuid(),
      recipeId,
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      optional: input.optional,
      sortOrder: idx,
    }))
    save(KEYS.ingredients, [...all, ...created])
    return created
  },

  async listByRecipeId(recipeId: string): Promise<Ingredient[]> {
    return load<Ingredient>(KEYS.ingredients)
      .filter((i) => i.recipeId === recipeId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  },
}

// ---------------------------------------------------------------------------
// Step repository
// ---------------------------------------------------------------------------

export const stepRepository = {
  async replaceForRecipe(recipeId: string, steps: StepInput[]): Promise<Step[]> {
    const all = load<Step>(KEYS.steps).filter((s) => s.recipeId !== recipeId)
    const created: Step[] = steps.map((input, idx) => ({
      id: uuid(),
      recipeId,
      instruction: input.instruction,
      durationMinutes: input.durationMinutes ?? null,
      sortOrder: idx,
    }))
    save(KEYS.steps, [...all, ...created])
    return created
  },

  async listByRecipeId(recipeId: string): Promise<Step[]> {
    return load<Step>(KEYS.steps)
      .filter((s) => s.recipeId === recipeId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  },
}

// ---------------------------------------------------------------------------
// Tag repository
// ---------------------------------------------------------------------------

export const tagRepository = {
  async findOrCreate(name: string): Promise<Tag> {
    const normalized = name.trim().toLowerCase()
    const tags = load<Tag>(KEYS.tags)
    const existing = tags.find((t) => t.name === normalized)
    if (existing) return existing
    const tag: Tag = { id: uuid(), name: normalized }
    tags.push(tag)
    save(KEYS.tags, tags)
    return tag
  },

  async reconcileForRecipe(recipeId: string, tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = []
    for (const name of tagNames) {
      tags.push(await tagRepository.findOrCreate(name))
    }

    // Replace recipe-tag associations
    const associations = load<{ recipeId: string; tagId: string }>(KEYS.recipeTags).filter(
      (a) => a.recipeId !== recipeId
    )
    for (const tag of tags) {
      associations.push({ recipeId, tagId: tag.id })
    }
    save(KEYS.recipeTags, associations)
    return tags
  },

  async listByRecipeId(recipeId: string): Promise<Tag[]> {
    const associations = load<{ recipeId: string; tagId: string }>(KEYS.recipeTags).filter(
      (a) => a.recipeId === recipeId
    )
    const tagIds = new Set(associations.map((a) => a.tagId))
    return load<Tag>(KEYS.tags).filter((t) => tagIds.has(t.id))
  },
}

// ---------------------------------------------------------------------------
// Collection repository
// ---------------------------------------------------------------------------

export const collectionRepository = {
  async createCollection(name: string, description?: string): Promise<Collection> {
    const id = uuid()
    const now = new Date().toISOString()
    const collection: Collection = {
      id,
      name,
      description: description ?? null,
      createdAt: now,
      updatedAt: now,
    }
    const collections = load<Collection>(KEYS.collections)
    collections.push(collection)
    save(KEYS.collections, collections)
    return collection
  },

  async listCollections(): Promise<Collection[]> {
    return load<Collection>(KEYS.collections).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
  },

  async addRecipeToCollection(collectionId: string, recipeId: string): Promise<void> {
    const links = load<{ collectionId: string; recipeId: string }>(KEYS.collectionRecipes)
    if (!links.some((l) => l.collectionId === collectionId && l.recipeId === recipeId)) {
      links.push({ collectionId, recipeId })
      save(KEYS.collectionRecipes, links)
    }
  },

  async removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<void> {
    const links = load<{ collectionId: string; recipeId: string }>(KEYS.collectionRecipes).filter(
      (l) => !(l.collectionId === collectionId && l.recipeId === recipeId)
    )
    save(KEYS.collectionRecipes, links)
  },

  async listRecipesInCollection(collectionId: string): Promise<Recipe[]> {
    const links = load<{ collectionId: string; recipeId: string }>(KEYS.collectionRecipes).filter(
      (l) => l.collectionId === collectionId
    )
    const recipeIds = new Set(links.map((l) => l.recipeId))
    return load<Recipe>(KEYS.recipes)
      .filter((r) => recipeIds.has(r.id) && !r.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async deleteCollection(id: string): Promise<void> {
    save(
      KEYS.collectionRecipes,
      load<{ collectionId: string; recipeId: string }>(KEYS.collectionRecipes).filter(
        (l) => l.collectionId !== id
      )
    )
    save(
      KEYS.collections,
      load<Collection>(KEYS.collections).filter((c) => c.id !== id)
    )
  },
}

// ---------------------------------------------------------------------------
// Sync queue repository
// ---------------------------------------------------------------------------

export const syncQueueRepository = {
  async enqueue(
    entry: Omit<SyncQueueEntry, 'id' | 'createdAt' | 'retryCount' | 'lastError' | 'status'>
  ): Promise<void> {
    const queue = load<SyncQueueEntry>(KEYS.syncQueue)
    queue.push({
      id: uuid(),
      ...entry,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastError: null,
      status: 'pending',
    })
    save(KEYS.syncQueue, queue)
  },

  async dequeuePending(): Promise<SyncQueueEntry[]> {
    return load<SyncQueueEntry>(KEYS.syncQueue)
      .filter((e) => e.status === 'pending')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async markFailed(id: string, error: string): Promise<void> {
    const queue = load<SyncQueueEntry>(KEYS.syncQueue)
    const idx = queue.findIndex((e) => e.id === id)
    if (idx !== -1) {
      queue[idx] = { ...queue[idx], status: 'failed', lastError: error, retryCount: queue[idx].retryCount + 1 }
      save(KEYS.syncQueue, queue)
    }
  },

  async clearEntry(id: string): Promise<void> {
    save(
      KEYS.syncQueue,
      load<SyncQueueEntry>(KEYS.syncQueue).filter((e) => e.id !== id)
    )
  },
}

// ---------------------------------------------------------------------------
// Cooking session repository
// ---------------------------------------------------------------------------

export const cookingSessionRepository = {
  async createOrResume(recipeId: string, servingsOverride?: number): Promise<ActiveCookingSession> {
    const sessions = load<ActiveCookingSession>(KEYS.cookingSessions)
    const existing = sessions.find((s) => s.recipeId === recipeId && !s.completedAt)
    if (existing) return existing

    const now = new Date().toISOString()
    const session: ActiveCookingSession = {
      id: uuid(),
      recipeId,
      servingsOverride: servingsOverride ?? null,
      checkedIngredientIds: [],
      checkedStepIds: [],
      startedAt: now,
      updatedAt: now,
      completedAt: null,
    }
    sessions.push(session)
    save(KEYS.cookingSessions, sessions)
    return session
  },

  async updateChecklist(
    sessionId: string,
    checkedIngredientIds: string[],
    checkedStepIds: string[]
  ): Promise<void> {
    const sessions = load<ActiveCookingSession>(KEYS.cookingSessions)
    const idx = sessions.findIndex((s) => s.id === sessionId)
    if (idx !== -1) {
      sessions[idx] = {
        ...sessions[idx],
        checkedIngredientIds,
        checkedStepIds,
        updatedAt: new Date().toISOString(),
      }
      save(KEYS.cookingSessions, sessions)
    }
  },

  async updateServings(sessionId: string, servingsOverride: number): Promise<void> {
    const sessions = load<ActiveCookingSession>(KEYS.cookingSessions)
    const idx = sessions.findIndex((s) => s.id === sessionId)
    if (idx !== -1) {
      sessions[idx] = {
        ...sessions[idx],
        servingsOverride,
        updatedAt: new Date().toISOString(),
      }
      save(KEYS.cookingSessions, sessions)
    }
  },

  async complete(sessionId: string, recipeId: string): Promise<void> {
    const now = new Date().toISOString()
    const sessions = load<ActiveCookingSession>(KEYS.cookingSessions)
    const idx = sessions.findIndex((s) => s.id === sessionId)
    if (idx !== -1) {
      sessions[idx] = { ...sessions[idx], completedAt: now, updatedAt: now }
      save(KEYS.cookingSessions, sessions)
    }

    // Update recipe lastCookedAt
    const recipes = load<Recipe>(KEYS.recipes)
    const rIdx = recipes.findIndex((r) => r.id === recipeId)
    if (rIdx !== -1) {
      recipes[rIdx] = { ...recipes[rIdx], lastCookedAt: now, updatedAt: now, syncStatus: 'pending' }
      save(KEYS.recipes, recipes)
    }

    await syncQueueRepository.enqueue({
      entityType: 'recipe',
      entityId: recipeId,
      operation: 'update',
      payload: JSON.stringify({ id: recipeId, lastCookedAt: now }),
    })
  },

  async getActiveForRecipe(recipeId: string): Promise<ActiveCookingSession | null> {
    const sessions = load<ActiveCookingSession>(KEYS.cookingSessions)
    return sessions.find((s) => s.recipeId === recipeId && !s.completedAt) ?? null
  },
}
