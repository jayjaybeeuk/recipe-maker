import * as SQLite from 'expo-sqlite'

// In React Native / Expo, files cannot be read dynamically at runtime via fs.
// Migrations are registered here statically, sorted lexicographically by name.
// Each .sql file in infra/db/migrations/ must have a corresponding entry below.
const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: '001_initial_schema.sql',
    sql: `
-- recipes
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  difficulty TEXT CHECK(difficulty IN ('easy','medium','hard')),
  cuisine TEXT,
  meal_type TEXT,
  source_url TEXT,
  notes TEXT,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  is_favorite INTEGER NOT NULL DEFAULT 0,
  image_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_cooked_at TEXT,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','failed')),
  search_text TEXT NOT NULL DEFAULT '',
  search_ingredients TEXT NOT NULL DEFAULT '',
  search_tags TEXT NOT NULL DEFAULT ''
);

-- ingredients
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  name TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  optional INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- steps
CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  instruction TEXT NOT NULL,
  duration_minutes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- recipe_tags
CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (recipe_id, tag_id)
);

-- collections
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- collection_recipes
CREATE TABLE IF NOT EXISTS collection_recipes (
  collection_id TEXT NOT NULL REFERENCES collections(id),
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  PRIMARY KEY (collection_id, recipe_id)
);

-- active_cooking_sessions
CREATE TABLE IF NOT EXISTS active_cooking_sessions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  servings_override INTEGER,
  checked_ingredient_ids TEXT NOT NULL DEFAULT '[]',
  checked_step_ids TEXT NOT NULL DEFAULT '[]',
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

-- sync_queue
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create','update','delete')),
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','failed'))
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_recipes_deleted_at ON recipes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at);
CREATE INDEX IF NOT EXISTS idx_recipes_last_cooked_at ON recipes(last_cooked_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_steps_recipe_id ON steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `.trim(),
  },
]

let dbInstance: SQLite.SQLiteDatabase | null = null

export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('recipe_maker.db')
  }
  return dbInstance
}

export async function runMigrations(): Promise<void> {
  const db = getDb()

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    )
  `)

  const sorted = [...MIGRATIONS].sort((a, b) => a.name.localeCompare(b.name))

  for (const migration of sorted) {
    const existing = await db.getFirstAsync<{ name: string }>(
      'SELECT name FROM _migrations WHERE name = ?',
      migration.name
    )

    if (!existing) {
      await db.execAsync(migration.sql)
      await db.runAsync(
        'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)',
        migration.name,
        new Date().toISOString()
      )
    }
  }
}
