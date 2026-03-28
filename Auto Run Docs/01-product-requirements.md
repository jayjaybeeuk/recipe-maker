# Product Requirements

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints.

## Goal

Deliver a personal recipe catalogue app that feels like a digital family cookbook.

## User Stories

### Recipe storage

- [x] As a user, I can create a recipe manually
<!-- Spec: 05-recipes-crud.md (createRecipe, recipeFormSchema), 04-ui-ux-and-navigation.md (Add Recipe screen) -->
- [x] As a user, I can edit an existing recipe
<!-- Spec: 05-recipes-crud.md (updateRecipe, recipeFormSchema, Save Behavior), 04-ui-ux-and-navigation.md (Edit Recipe screen app/(stack)/recipes/[id]/edit.tsx) -->
- [x] As a user, I can delete a recipe
<!-- Impl: infra/db/repositories/recipe-repository.ts (deleteRecipe soft-delete + sync_queue enqueue), features/recipes/store.ts (deleteRecipe action), app/(stack)/recipe/[id]/index.tsx (ActionSheetIOS on iOS / Alert.alert on Android, navigates back on confirm). Tests: infra/db/repositories/__tests__/recipe-repository.test.ts (15 tests). -->
- [x] As a user, I can attach a photo to a recipe
<!-- Impl: shared/components/ui/image-picker-field.tsx (ImagePickerField — camera + library picker, local URI stored immediately, accessible). Wired into app/(stack)/recipes/new.tsx and app/(stack)/recipes/[id]/edit.tsx. Tests: shared/components/ui/__tests__/image-picker-field.test.ts (5 tests). Cloud upload deferred to Phase 5 sync. -->
- [ ] As a user, I can mark a recipe as a favorite
- [ ] As a user, I can add notes and substitutions to a recipe

### Discovery

- [ ] As a user, I can search recipes by title
- [ ] As a user, I can search by ingredient
- [ ] As a user, I can filter by cuisine
- [ ] As a user, I can filter by meal type
- [ ] As a user, I can filter by tags
- [ ] As a user, I can sort by newest, favorite, quickest, last cooked

### Cooking workflow

- [ ] As a user, I can enter a cooking mode view
- [ ] As a user, I can tick off ingredients
- [ ] As a user, I can tick off steps
- [ ] As a user, I can adjust servings and see ingredient amounts update
- [ ] As a user, I can launch timers from recipe steps
- [ ] As a user, I can keep my place while cooking

### Sync and continuity

- [ ] As a user, I can use the app offline
- [ ] As a user, I can sign in and sync recipes across devices
- [ ] As a user, I can continue using the same recipe data on phone and desktop

## Functional Requirements

- [ ] App supports recipe CRUD
- [ ] App stores structured ingredients and method steps
- [ ] App supports local full-text-like search behavior for recipe metadata
- [ ] App supports filter combinations
- [ ] App supports image attachment per recipe
- [ ] App supports favorites, ratings, notes
- [ ] App tracks created, updated, and last cooked timestamps
- [ ] App supports collections or tag-based grouping
- [ ] App supports cooking mode with persistent progress for active session

## Non-Functional Requirements

- [ ] Launch to usable state in under 3 seconds on a warm start
- [ ] Search result update in under 150ms for local dataset up to 5,000 recipes
- [ ] Core recipe access must work offline
- [ ] UI must be touch-friendly
- [ ] Text must remain legible in cooking mode at arm's length
- [ ] Local-first storage must not lose edits when network is unavailable
