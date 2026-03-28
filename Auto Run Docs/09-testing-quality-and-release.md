# Testing, Quality, and Release

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints.

## Testing Pyramid

### Unit Tests (Vitest)

- Domain mappers (e.g., DB row → TypeScript type)
- Zod validation schemas (valid and invalid inputs)
- Servings scaling logic (`scaleQuantity`)
- Search query builder (`buildRecipeQuery` — all filter combinations)
- Sync queue reducer / processor logic (enqueue, retry, backoff)
- Date/time utilities

### Component Tests (React Native Testing Library)

- RecipeCard renders title, tags, time, favorite badge
- Recipe form validates required fields and shows inline errors
- Filter chips render and dismiss correctly
- Cooking mode checklist toggles and marks complete
- Servings adjuster updates displayed quantities

### Integration Tests (Vitest + in-memory SQLite or real Expo SQLite)

- Create recipe → appears in list query
- Edit recipe → updated values returned by search
- Soft delete → excluded from default queries
- Start cooking session → resume on re-open
- Offline mutation → sync queue entry created → replay on connection

### E2E Tests (Detox)

- Onboard: launch app, confirm home screen loads
- Add recipe: fill form, save, find in recipe list
- Search recipe: type title fragment, see result, clear
- Favorite recipe: toggle, filter by favorite, confirm appears
- Cook recipe: start session, check ingredient, advance step, mark cooked
- Sign in and sync: authenticate, confirm sync status updates

## Tooling

- **Vitest** — unit and integration tests
- **React Native Testing Library** — component tests
- **Detox** — E2E on iOS and Android
- **ESLint** — linting (Expo config + TypeScript rules)
- **Prettier** — code formatting
- **TypeScript strict mode** — `"strict": true` in tsconfig

## CI Pipeline (GitHub Actions)

```yaml
jobs:
  quality:
    steps:
      - typecheck: npx tsc --noEmit
      - lint: npx eslint . --ext .ts,.tsx
      - format-check: npx prettier --check .
      - unit-tests: npx vitest run
      - component-tests: npx vitest run --reporter=verbose
  build:
    steps:
      - expo-web-build: npx expo export -p web
      - eas-preview (optional): eas build --profile preview --platform all --non-interactive
```

## Release Targets

- **iOS**: EAS Build → TestFlight → App Store
- **Android**: EAS Build → Internal Testing → Play Store
- **Web/Desktop Phase 1**: `expo export -p web`, host on Vercel or Netlify
- **Desktop Phase 2**: Wrap Expo web build with Tauri

## Environment Configuration

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # CI only, never ship to client
```

## Implementation Tasks

- [ ] Configure Vitest in `vitest.config.ts` with React Native environment (use `vitest-environment-minidom` or equivalent), path aliases matching tsconfig, and coverage thresholds (80% for `features/` and `infra/`)
- [ ] Configure React Native Testing Library setup file and add to Vitest config
- [ ] Write unit test suite for `scaleQuantity` utility covering null, integer result, decimal, and fraction cases
- [ ] Write unit test suite for `buildRecipeQuery` covering all individual filters and multiple combined filters
- [ ] Write unit test suite for Zod recipe form schema covering valid recipe, missing title, missing ingredients, missing steps, invalid URL, out-of-range rating
- [ ] Write component tests for RecipeCard, RecipeForm (validation error display), FilterChips (dismiss), and CookingChecklist (toggle)
- [ ] Write integration test for create → list → search → edit → soft-delete recipe lifecycle using real SQLite (Expo SQLite in test environment or mocked with better-sqlite3)
- [ ] Write integration test for sync queue: create offline recipe → verify sync_queue entry → simulate push → verify entry cleared
- [ ] Configure ESLint with `eslint-config-expo` and `@typescript-eslint` rules, including no-console rule
- [ ] Configure Prettier with project-standard settings and add format-check script
- [ ] Add GitHub Actions CI workflow at `.github/workflows/ci.yml` running typecheck, lint, format-check, and unit tests on push and PR
- [ ] Create `eas.json` with development, preview, and production build profiles
- [ ] Create `.env.example` documenting all required environment variables
- [ ] Write release checklist document at `docs/release-checklist.md` covering: env vars set, EAS build succeeds, smoke tests pass on device, Supabase RLS verified, changelog updated
