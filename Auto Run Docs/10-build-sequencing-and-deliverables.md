# Build Sequencing and Deliverables

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints. Each phase should leave the app in a runnable state.

## Phase 1 — Foundation

Goal: runnable app shell with navigation, styling, state, and database infrastructure.

- [ ] Initialize Expo TypeScript project with `npx create-expo-app -t expo-template-blank-typescript`, configure folder structure matching architecture in 02-system-architecture.md
- [ ] Install and configure Expo Router: add to `app.json`, create `app/(tabs)/_layout.tsx` with 5 tabs (Home, Recipes, Collections, Search, Settings), create placeholder screens for each tab
- [ ] Install and configure NativeWind: add `nativewind` and `tailwindcss`, configure `tailwind.config.js` with warm color palette, verify className styling works on a test component
- [ ] Install and configure Zustand: create store structure with feature slices (recipes, search, cooking, auth, sync), verify TypeScript types resolve
- [ ] Install `expo-sqlite`, create migration runner in `infra/db/migration-runner.ts`, create migration 001 with all tables and indexes from 03-data-model-and-storage.md, verify migration runs on app start in dev build
- [ ] Configure ESLint (`eslint-config-expo`, `@typescript-eslint`), Prettier, TypeScript strict mode (`"strict": true`), add lint and format scripts to package.json
- [ ] Configure Vitest with React Native environment, add `test` script, verify a trivial test passes
- [ ] Verify dev build runs on iOS simulator, Android emulator, and Expo web: `expo start --ios`, `expo start --android`, `expo start --web`

## Phase 2 — Recipe Core

Goal: full recipe CRUD working locally with all screens navigable.

- [ ] Implement all TypeScript interfaces and Zod schemas from 03-data-model-and-storage.md in `shared/types/`
- [ ] Implement RecipeRepository, IngredientRepository, StepRepository, TagRepository in `infra/db/repositories/` as specified in 05-recipes-crud.md
- [ ] Implement recipe Zustand store slice in `features/recipes/store.ts`
- [ ] Build RecipeCard shared component, Recipes list screen with cards, and Recipe Detail screen as specified in 04-ui-ux-and-navigation.md
- [ ] Build Add Recipe screen and Edit Recipe screen with React Hook Form + Zod, reorderable rows, image picker, and inline validation
- [ ] Build delete confirmation flow and favorite toggle
- [ ] Add unit tests for RecipeRepository and Zod schema as specified in 05-recipes-crud.md

## Phase 3 — Discovery

Goal: search and filtering fully functional on local data.

- [ ] Implement `buildRecipeQuery` utility and RecipeFilters type in `features/search/`
- [ ] Implement filter Zustand store slice in `features/search/store.ts`
- [ ] Build SearchInput, FilterChips, and SortSelector components
- [ ] Wire Recipes screen and Search screen to filter store
- [ ] Add recent search persistence via AsyncStorage
- [ ] Add unit tests for query builder as specified in 06-search-filtering-and-indexing.md

## Phase 4 — Interactive Cooking

Goal: cooking mode fully functional with session persistence.

- [ ] Implement CookingSessionRepository in `infra/db/repositories/`
- [ ] Implement `scaleQuantity` utility in `shared/utils/servings.ts`
- [ ] Implement Cooking Mode Zustand store in `features/cooking/store.ts`
- [ ] Build Cooking Mode screen with large typography, checklist, servings adjuster, timers, and keep-awake
- [ ] Add unit tests for scaleQuantity and integration test for cooking session lifecycle

## Phase 5 — Sync and Media

Goal: optional cloud sync and image upload working end-to-end.

- [ ] Create Supabase project, apply `supabase-schema.sql`, verify RLS policies
- [ ] Implement auth store and build sign-in / sign-up screens
- [ ] Implement SyncQueueRepository and SyncProcessor
- [ ] Wire SyncProcessor to app foreground and post-write triggers
- [ ] Implement image upload service with compression
- [ ] Add sync status UI to Settings screen
- [ ] Add integration tests for offline → online sync replay

## Phase 6 — Quality and Release

Goal: production-ready builds with CI and test coverage.

- [ ] Add remaining component tests and integration tests as specified in 09-testing-quality-and-release.md
- [ ] Add GitHub Actions CI workflow at `.github/workflows/ci.yml`
- [ ] Performance audit: measure search latency with 1,000 and 5,000 seeded recipes, add indexes if needed
- [ ] Accessibility audit: verify touch targets, dynamic text, color contrast, and semantic labels
- [ ] Create `eas.json` build profiles and verify EAS build succeeds for iOS and Android
- [ ] Configure Expo web export and verify desktop/web build works
- [ ] Create `.env.example` and `docs/release-checklist.md`
- [ ] Final smoke test on physical iOS and Android devices

## Required Final Artifacts

- Source code in a clean git repository
- SQLite migration files in `infra/db/migrations/`
- Supabase schema SQL in `infra/sync/supabase-schema.sql`
- Architecture doc (this spec set)
- `.env.example` with all required env vars
- `eas.json` with development, preview, production profiles
- Test suite with 80%+ coverage on features/ and infra/
- `docs/release-checklist.md`
- `README.md` with setup, dev, test, and release instructions
