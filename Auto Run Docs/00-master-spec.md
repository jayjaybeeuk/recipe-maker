# Recipe Catalogue App - Master Technical Specification

## Objective

Build a personal, cross-platform recipe catalogue application for iOS, Android, and desktop using TypeScript. The app should allow the user to store, organize, search, and interact with favorite recipes in a polished, mobile-first experience.

## Product Vision

Create a private digital cookbook optimized for:

- saving favorite recipes
- finding them quickly
- using them practically during cooking
- syncing across devices
- working offline in the kitchen

## Primary User

One primary user initially: the owner's wife.
Secondary future mode: optional family/shared household access.

## Core Product Principles

1. Fast to capture recipes
2. Fast to retrieve recipes
3. Excellent in-kitchen usability
4. Offline-first behavior
5. Clean and warm user experience
6. One TypeScript codebase across platforms

## Platform Targets

- iOS
- Android
- Desktop
- Optional web build

## Recommended Stack

- App framework: React Native with Expo
- Language: TypeScript
- Navigation: Expo Router
- State: Zustand
- Local database: SQLite via Expo SQLite
- Backend/sync: Supabase
- Validation: Zod
- Forms: React Hook Form
- UI styling: NativeWind
- UI components (native): React Native Reusables (`rnr`) — shadcn/ui-style components for React Native + NativeWind
- UI components (web): shadcn/ui — used in the Expo web build where DOM rendering is available
- Testing: Vitest, React Native Testing Library, Detox
- Desktop path:
  - Phase 1: Expo web support
  - Phase 2: package desktop with Tauri if needed

## Component Library Strategy

shadcn/ui runs on Radix UI (DOM-only) and cannot be used directly in React Native. The solution across this codebase:

- **iOS/Android**: use React Native Reusables (`rnr`) — same copy-paste model, same shadcn API conventions, built on NativeWind
- **Expo web build**: use shadcn/ui components where the DOM renderer is available
- Prefer `rnr` components as the default; fall back to custom NativeWind components only when `rnr` does not provide a suitable primitive
- Component names and API should mirror shadcn/ui conventions (e.g., `Button`, `Card`, `Input`, `Sheet`, `Dialog`) so web and native implementations stay structurally consistent

## Why this stack

- One TS codebase
- Strong mobile support
- Good offline/local DB options
- Fast iteration
- Easy future cloud sync
- Good path to desktop without rewriting core app
- shadcn-style components give a polished, consistent UI with minimal custom styling effort

## MVP Scope

The MVP must support:

- add recipe
- edit recipe
- delete recipe
- mark favorite
- attach recipe photo
- search recipes by title, ingredient, tag
- filter recipes
- recipe detail screen
- interactive cooking mode
- servings scaling
- offline local persistence
- optional account-based sync

## Non-MVP / Future Scope

- import recipe from URL
- OCR handwritten recipe import
- shopping list generation
- meal planner
- voice navigation
- recipe sharing
- AI suggestions from available ingredients

## Definition of Done

The product is complete for MVP when:

- the same codebase runs on iOS, Android, and desktop/web
- recipes persist locally
- recipe search is responsive
- cooking mode is usable with large text and progress tracking
- sync works for authenticated users
- tests cover core flows
- release builds can be produced for mobile and desktop/web

## Constraints

- TypeScript-first
- Mobile-first UX
- Offline-first data access
- Avoid overengineering in v1
- Do not depend on cloud availability for core cooking usage
