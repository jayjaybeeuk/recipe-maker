# System Architecture

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints.

## Architecture Style
Offline-first client application with optional cloud sync.

## High-Level Components
1. Presentation layer
2. Local application state
3. Local persistence layer
4. Search and filtering layer
5. Sync service
6. Media upload/storage service
7. Optional authentication layer

## Technology Decisions
- React Native + Expo for cross-platform app shell
- Expo Router for file-based navigation
- Zustand for app and UI state
- SQLite as source of truth on device
- Supabase Postgres as cloud replica and sync target
- Supabase Storage for recipe images
- React Hook Form + Zod for create/edit recipe flows
- React Native Reusables (`rnr`) for shadcn/ui-style UI components on iOS/Android
- shadcn/ui for UI components in the Expo web build
- NativeWind as the styling layer underlying both component libraries

## Data Flow
1. User creates/edits recipe in UI
2. Form validates using Zod
3. Repository writes to SQLite
4. Zustand store refreshes queried data
5. Sync queue records local mutation
6. Background sync attempts to push changes to Supabase when authenticated and online
7. Pull sync updates local records using last-updated timestamps and tombstones

## Architectural Rules
- SQLite is the runtime source of truth for reads
- UI must never depend directly on remote calls for core recipe viewing
- Network sync is asynchronous and resilient
- Search must work on local data
- All domain logic should live outside screen components
- Shared domain types must be platform-agnostic TypeScript modules

## Module Structure
```
app/                        # Expo Router screens and navigation
features/
  recipes/                  # Recipe CRUD domain
  search/                   # Search and filtering
  cooking/                  # Cooking mode
  collections/              # Collections and tags
  settings/                 # User preferences and sync settings
shared/
  components/               # Reusable UI components
  types/                    # Shared TypeScript interfaces
  utils/                    # Pure utility functions
infra/
  db/                       # SQLite setup, migrations, repositories
  sync/                     # Sync queue processor
  storage/                  # Media upload service
  auth/                     # Supabase auth integration
```

## Implementation Tasks
- [x] Create Expo TypeScript project with folder structure matching architecture
- [x] Set up Expo Router with tab and stack navigation shells
  <!-- Installed expo-router, expo-linking, expo-constants, react-native-screens, react-native-safe-area-context. Updated package.json main to expo-router/entry. Added scheme and expo-router plugin to app.json. Created root _layout.tsx (Stack with SafeAreaProvider), (tabs)/_layout.tsx (4 tabs: Recipes, Search, Collections, Settings), (stack)/_layout.tsx (recipe detail, new, edit, cooking mode). Added placeholder screens for all routes. -->
- [x] Configure NativeWind for styling
  <!-- Installed nativewind + tailwindcss. Created tailwind.config.js (content paths cover app/, features/, shared/, infra/ with nativewind/preset). Created babel.config.js (babel-preset-expo with jsxImportSource: 'nativewind' + nativewind/babel preset). Created metro.config.js (withNativeWind wrapper pointing at global.css). Created global.css (@tailwind base/components/utilities). Updated app/_layout.tsx to import global.css. Added nativewind-env.d.ts with /// <reference types="nativewind/types" /> for className prop TypeScript support. -->
- [ ] Install and configure React Native Reusables (`rnr`): add core primitives (Button, Card, Input, Text, Sheet, Dialog, Checkbox, Badge) and verify they render correctly with NativeWind on iOS and Android
- [ ] Install shadcn/ui and configure it for the Expo web build: add components (Button, Card, Input, Sheet, Dialog, Checkbox, Badge) matching the rnr set used in native
- [ ] Set up Zustand store structure with feature slices
- [ ] Initialize Expo SQLite and migration runner
- [ ] Configure ESLint, Prettier, TypeScript strict mode
- [ ] Add Vitest and React Native Testing Library
- [ ] Verify dev build runs on iOS simulator, Android emulator, and web
