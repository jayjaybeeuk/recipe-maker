# Phase 1 — Foundation: Project Initialisation

> **Working directory:** `/Users/jamesbolton/Documents/GIT/Personal/Recipe-Maker`
> **Package manager:** npm
> **Goal:** Runnable Expo TypeScript app shell with navigation, component library, styling, state, SQLite infrastructure, and tooling configured. Every task must leave the repo in a buildable state.

---

## Context for all tasks
- Stack: React Native + Expo (SDK 52+), TypeScript, Expo Router, NativeWind, React Native Reusables (`rnr`), Zustand, Expo SQLite, Vitest
- Supabase is **Phase 5** — do not install or configure it here
- Use `npm` for all package management
- TypeScript strict mode required throughout
- No `console.log` in production code

---

## Task 1 — Initialise Expo TypeScript project and create folder structure

- [x] From `/Users/jamesbolton/Documents/GIT/Personal/Recipe-Maker`, initialise the Expo project in-place with `npx create-expo-app@latest . --template expo-template-blank-typescript` using npm (pass `--yes` or confirm prompts non-interactively if possible). After initialisation, verify `package.json`, `app.json`, `tsconfig.json`, and `App.tsx` (or `app/_layout.tsx`) exist. Then create the full module directory structure below — create each directory with a `.gitkeep` placeholder file if empty:

  ```
  app/
    (tabs)/
    (stack)/
  features/
    recipes/
      components/
    search/
      components/
    cooking/
      components/
    collections/
      components/
    settings/
      components/
  shared/
    components/
    types/
    utils/
  infra/
    db/
      migrations/
      repositories/
    sync/
    storage/
    auth/
  ```

  Verify the directory tree exists with `find . -type d -not -path '*/node_modules/*' -not -path '*/.expo/*'`.

---

## Task 2 — Install and configure Expo Router with tab and stack navigation shells

- [x] Install Expo Router and its peer dependencies: `npm install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar`. Update `package.json` `"main"` field to `"expo-router/entry"`. Update `app.json` to add `"scheme": "recipemaker"` and set `"web": { "bundler": "metro" }` under the `expo` key. Create `app/_layout.tsx` as a root Stack layout that wraps the app in `<SafeAreaProvider>`. Create `app/(tabs)/_layout.tsx` as a `<Tabs>` navigator with five tabs: **Home** (`index`), **Recipes** (`recipes`), **Collections** (`collections`), **Search** (`search`), **Settings** (`settings`) — each tab should have an appropriate `title` and placeholder `tabBarIcon`. Create placeholder screen files for each tab:
  - `app/(tabs)/index.tsx` — Home (renders `<Text>Home</Text>`)
  - `app/(tabs)/recipes.tsx` — Recipes
  - `app/(tabs)/collections.tsx` — Collections
  - `app/(tabs)/search.tsx` — Search
  - `app/(tabs)/settings.tsx` — Settings

  Also create placeholder stack screens:
  - `app/(stack)/recipes/[id].tsx` — Recipe Detail
  - `app/(stack)/recipes/new.tsx` — Add Recipe
  - `app/(stack)/recipes/[id]/edit.tsx` — Edit Recipe
  - `app/(stack)/recipes/[id]/cook.tsx` — Cooking Mode

  All screen files must be valid TypeScript React Native components that compile without errors.

---

## Task 3 — Install and configure NativeWind with warm colour palette

- [ ] Install NativeWind and Tailwind CSS: `npm install nativewind tailwindcss`. Run `npx tailwindcss init` to generate `tailwind.config.js`. Configure `tailwind.config.js` content paths to include `./app/**/*.{js,jsx,ts,tsx}`, `./features/**/*.{js,jsx,ts,tsx}`, `./shared/**/*.{js,jsx,ts,tsx}`, `./infra/**/*.{js,jsx,ts,tsx}`. Add the following warm colour palette as custom theme colours in `tailwind.config.js`:

  ```js
  colors: {
    brand: {
      50:  '#fdf8f0',
      100: '#faefd9',
      200: '#f4dbb0',
      300: '#ecc27c',
      400: '#e4a24a',
      500: '#dc8a2a',   // primary
      600: '#c97020',
      700: '#a8551c',
      800: '#87441e',
      900: '#6e381c',
    },
    surface: {
      DEFAULT: '#fdf8f0',
      muted: '#f5efe3',
    }
  }
  ```

  Add NativeWind babel plugin to `babel.config.js` (add `"nativewind/babel"` to the plugins array). Create `global.css` at the project root containing `@tailwind base; @tailwind components; @tailwind utilities;`. Import `./global.css` at the top of `app/_layout.tsx`. Update `app/_layout.tsx` to wrap with `<GestureHandlerRootView style={{ flex: 1 }}>` if not already present. Verify NativeWind is working by adding a `className="bg-brand-500 p-4"` to the Home screen placeholder and confirming no TypeScript errors.

---

## Task 4 — Install and configure React Native Reusables (rnr) core primitives

- [ ] Install React Native Reusables and its dependencies. RNR uses a copy-paste model — install the CLI and then add the required primitives. Run: `npm install @rn-primitives/portal @rn-primitives/slot`. Then manually create the following `rnr` components in `shared/components/ui/` by following the React Native Reusables source patterns for NativeWind — create each as a proper TypeScript component file:

  - `button.tsx` — Button component with `variant` prop (`default`, `outline`, `ghost`, `destructive`) and `size` prop (`sm`, `default`, `lg`)
  - `card.tsx` — Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription components
  - `input.tsx` — Input component wrapping TextInput with NativeWind styling and error state support
  - `badge.tsx` — Badge component with `variant` prop (`default`, `secondary`, `outline`, `destructive`)
  - `separator.tsx` — Separator component (horizontal/vertical)
  - `skeleton.tsx` — Skeleton loading placeholder using Animated opacity pulse
  - `text.tsx` — Typography Text component with `variant` prop (`h1`, `h2`, `h3`, `body`, `muted`, `small`)
  - `checkbox.tsx` — Checkbox component with checked state and onPress handler

  All components must:
  - Accept `className` prop for NativeWind overrides
  - Export proper TypeScript prop interfaces
  - Use the brand colour palette defined in Task 3
  - Follow the shadcn/ui API naming conventions

  Export all components from `shared/components/ui/index.ts`.

---

## Task 5 — Install and configure Zustand store structure

- [ ] Install Zustand: `npm install zustand`. Create the following store slice files — each should export a typed Zustand slice with placeholder state and actions (fully typed, no `any`):

  - `features/recipes/store.ts` — `RecipeStore` with: `recipes: Recipe[]`, `selectedRecipeId: string | null`, `isLoading: boolean`, `error: string | null`, actions: `setRecipes`, `setSelectedRecipe`, `setLoading`, `setError`
  - `features/search/store.ts` — `SearchStore` with: `searchText: string`, `cuisine: string | null`, `mealType: string | null`, `tags: string[]`, `isFavorite: boolean`, `maxTotalMinutes: number | null`, `sortBy: SortOption` (type: `'newest' | 'updated' | 'favorite' | 'quickest' | 'rated' | 'lastCooked'`), actions: `setSearchText`, `setCuisine`, `setMealType`, `toggleTag`, `setIsFavorite`, `setMaxTotalMinutes`, `setSortBy`, `clearAll`
  - `features/cooking/store.ts` — `CookingStore` with: `session: ActiveCookingSession | null`, `currentStepIndex: number`, `timers: Record<string, TimerState>`, actions: `setSession`, `setCurrentStep`, `startTimer`, `cancelTimer`, `clearSession`
  - `infra/auth/store.ts` — `AuthStore` with: `session: null`, `user: null`, `isLoading: boolean`, actions: `setLoading` (stub — Supabase wired in Phase 5)
  - `infra/sync/store.ts` — `SyncStore` with: `lastSyncedAt: string | null`, `pendingCount: number`, `failedCount: number`, `isSyncing: boolean`, actions: `setSyncStatus` (stub)

  Create `shared/types/index.ts` and define the core TypeScript interfaces needed by the stores:
  - `Recipe` (id, title, isFavorite, syncStatus, createdAt, updatedAt — minimal shape, full schema in Phase 2)
  - `ActiveCookingSession` (id, recipeId, checkedIngredientIds, checkedStepIds, startedAt, updatedAt)
  - `TimerState` (stepId, totalSeconds, remainingSeconds, running)
  - `SortOption`

  Create a root store composition file at `shared/store.ts` that exports all stores for convenience. Verify TypeScript compiles with no errors across all store files.

---

## Task 6 — Install Expo SQLite and create migration runner with migration 001

- [ ] Install Expo SQLite: `npm install expo-sqlite`. Create the migration runner at `infra/db/migration-runner.ts`. The runner must:
  1. Open (or create) the SQLite database named `recipe_maker.db` using `expo-sqlite`
  2. Create a `_migrations` table if it does not exist: `(id INTEGER PRIMARY KEY, name TEXT UNIQUE, applied_at TEXT)`
  3. Read all `.sql` files from `infra/db/migrations/` in lexicographic order
  4. For each migration file, check if its name exists in `_migrations` — if not, execute the SQL and insert the migration name with current timestamp
  5. Export a `runMigrations(): Promise<void>` function and a `getDb(): SQLiteDatabase` singleton

  Create migration file `infra/db/migrations/001_initial_schema.sql` defining all tables with the following schema:

  ```sql
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
  ```

  Call `runMigrations()` inside `app/_layout.tsx` on app start (before rendering children) using a `useEffect` with a loading gate. Verify TypeScript compiles with no errors.

---

## Task 7 — Configure ESLint, Prettier, and TypeScript strict mode

- [ ] Install dev dependencies: `npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-expo prettier eslint-config-prettier eslint-plugin-prettier`. Create `.eslintrc.js` at the project root:

  ```js
  module.exports = {
    extends: [
      'expo',
      'plugin:@typescript-eslint/recommended',
      'prettier',
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    parser: '@typescript-eslint/parser',
  }
  ```

  Create `.prettierrc` at the project root:

  ```json
  {
    "semi": false,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100,
    "tabWidth": 2
  }
  ```

  Create `.prettierignore` excluding: `node_modules`, `.expo`, `dist`, `build`, `*.sql`.

  Update `tsconfig.json` to ensure `"strict": true` is set under `compilerOptions`. Also add `"baseUrl": "."` and `"paths"` aliases:

  ```json
  "paths": {
    "@/*": ["./*"],
    "@features/*": ["./features/*"],
    "@shared/*": ["./shared/*"],
    "@infra/*": ["./infra/*"]
  }
  ```

  Add scripts to `package.json`:
  ```json
  "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit"
  ```

  Run `npm run typecheck` and `npm run lint` — fix any errors that arise from the project files created so far (do not suppress errors with `// eslint-disable`). Confirm both commands exit with code 0.

---

## Task 8 — Configure Vitest and React Native Testing Library

- [ ] Install test dependencies: `npm install -D vitest @testing-library/react-native @testing-library/jest-native @vitest/coverage-v8 react-test-renderer`. Create `vitest.config.ts` at the project root:

  ```ts
  import { defineConfig } from 'vitest/config'
  import path from 'path'

  export default defineConfig({
    test: {
      environment: 'node',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
        },
        include: ['features/**', 'infra/**', 'shared/**'],
        exclude: ['**/*.d.ts', '**/__tests__/**'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@features': path.resolve(__dirname, 'features'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@infra': path.resolve(__dirname, 'infra'),
      },
    },
  })
  ```

  Create `vitest.setup.ts`:

  ```ts
  import '@testing-library/jest-native/extend-expect'
  ```

  Add test scripts to `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```

  Write a smoke test at `shared/utils/__tests__/smoke.test.ts` that imports nothing from React Native (to avoid native module issues) and verifies 1 + 1 === 2. Run `npm test` and confirm it passes. Write a second smoke test at `shared/utils/__tests__/types.test.ts` that imports the `SortOption` type from `shared/types/index.ts` and verifies the store initial state shape — this confirms TypeScript paths resolve in tests. Confirm `npm test` passes with 2 passing tests and 0 failures.

---

## Human verification steps (do not use checkbox syntax — these require manual action)

- Start the dev server with `npm start` and verify the app loads in Expo Go or a simulator
- Confirm all 5 tabs are visible and tappable
- Confirm no red error screen on launch
- Confirm `npm run typecheck` exits 0
- Confirm `npm run lint` exits 0
- Confirm `npm test` passes
