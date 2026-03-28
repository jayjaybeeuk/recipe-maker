# UI/UX and Navigation

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints.

## Navigation Model
Expo Router with tab navigation at root level and stack navigation for detail flows.

```
(tabs)/
  index            # Home
  recipes          # Recipe list
  collections      # Collections
  search           # Search
  settings         # Settings

(stack)/
  recipes/[id]           # Recipe detail
  recipes/[id]/edit      # Edit recipe
  recipes/new            # Add recipe
  recipes/[id]/cook      # Cooking mode
  collections/[id]       # Collection detail
```

## Tab Screens

### Home
- Favorites horizontal carousel/list
- Recently cooked recipes section
- Quick filter chips (e.g., Quick, Vegetarian, Favorites)
- Pinned collections row
- Prominent "Add Recipe" CTA button

### Recipes
- List/grid view toggle (default: list)
- Search input bar (debounced, 150ms)
- Horizontal scrollable filter chips
- Sort selector dropdown/sheet
- Recipe cards showing: photo thumbnail, title, tags, total time, favorite indicator

### Collections
- List of user-created collections
- Card with name, description, recipe count
- Create collection CTA

### Search
- Persistent search input (focused on entry)
- Recent searches list when empty
- Active filter chips row
- Clear-all action
- Results list identical to Recipes screen cards

### Settings
- Account / sign-in section
- Sync status and manual retry
- App preferences (theme, default view)
- About section

## Detail Flows

### Recipe Detail
- Hero image (placeholder if none)
- Title, cuisine, meal type metadata row
- Prep/cook time, servings, difficulty chips
- Favorite toggle action
- Ingredients section with quantities
- Steps section numbered
- Notes section (if present)
- Source link (if present)
- Edit button (header or FAB)
- "Start Cooking" primary CTA

### Add / Edit Recipe
Form sections (scrollable, validated):
1. Basic info: title, description, cuisine, meal type, difficulty, prep time, cook time, servings, rating, source URL
2. Ingredients: reorderable rows (name, quantity, unit, optional toggle), add row button
3. Steps: reorderable rows (instruction, timer duration), add row button
4. Tags: tag picker/input
5. Notes: multiline text input
6. Image: image picker, preview

Behavior:
- Inline validation messages on blur
- Save button disabled until title + 1 ingredient + 1 step present
- Confirm discard on back if form is dirty

### Cooking Mode
- Large typography (min 20px body, 28px+ headings)
- Servings adjuster (– / current / +) at top
- Ingredients checklist (checkbox rows, strikethrough on check)
- Steps checklist with step number and instruction
- Timer button on steps with durationMinutes
- Previous/Next step navigation
- Progress indicator (step X of Y)
- Keep-screen-awake (via `expo-keep-awake` or equivalent)
- "Mark as Cooked" action to complete session

## Component Library Usage

### React Native (iOS/Android)
Use **React Native Reusables (`rnr`)** as the primary component source. It follows the shadcn/ui copy-paste model and is built on NativeWind.

Preferred `rnr` primitives and their usage in this app:

| Primitive | Used for |
|-----------|----------|
| `Button` | All CTAs, favorite toggle, cooking actions |
| `Card` | Recipe cards, collection cards |
| `Input` | Search bar, form text fields |
| `Checkbox` | Ingredient and step checklists in cooking mode |
| `Badge` | Tags, cuisine, meal type chips |
| `Sheet` (bottom sheet) | Sort selector, filter panels, delete confirmation |
| `Dialog` | Alerts and confirmations on larger viewports |
| `Separator` | Section dividers in recipe detail |
| `Avatar` | User avatar in settings/auth |
| `Progress` | Cooking mode step progress indicator |
| `Skeleton` | Loading placeholders |

### Expo Web Build
Use **shadcn/ui** components on the web build where Radix UI / DOM rendering is available. Mirror the same component names (Button, Card, Input, etc.) to keep screen structure consistent across platforms.

### Custom Components
Only build custom components when `rnr` or shadcn/ui does not provide a suitable primitive. Examples requiring custom implementation:
- `RecipeCard` (extends `rnr` Card with photo, time, tags layout)
- `IngredientRow` / `StepRow` (reorderable form rows)
- `ServingsAdjuster` (stepper UI for cooking mode)
- `HeroImage` (full-width recipe photo with fallback)
- `EmptyState` (illustration + CTA layout)
- `TimerDisplay` (countdown with circular progress)

## Component Conventions
- Minimum touch target: 44x44pt
- Consistent spacing scale (4, 8, 12, 16, 24, 32px)
- Warm color palette applied via NativeWind CSS variables — define in `tailwind.config.js` as custom colors so both `rnr` and shadcn/ui themes can reference the same tokens
- Loading skeletons using `rnr` Skeleton primitive
- Empty states with helpful illustration and CTA

## Accessibility
- Support dynamic text scaling where practical
- Semantic accessibility labels on all interactive controls
- Sufficient color contrast (WCAG AA minimum)
- No color as sole indicator of state

## Implementation Tasks
- [ ] Create tab layout in `app/(tabs)/_layout.tsx` with Home, Recipes, Collections, Search, Settings tabs using Expo Router
- [ ] Build Home screen with favorites carousel, recently cooked section, quick filter chips (using `rnr` Badge), and add recipe CTA (using `rnr` Button) — using EmptyState and Skeleton placeholders
- [ ] Build Recipes screen with list/grid toggle, search input (using `rnr` Input), filter chips (using `rnr` Badge), sort selector (using `rnr` Sheet as bottom sheet), and RecipeCard component
- [ ] Build RecipeCard component in `shared/components/` extending `rnr` Card with photo thumbnail, title, tag Badges, time, and favorite indicator
- [ ] Build Recipe Detail screen `app/(stack)/recipes/[id].tsx` with HeroImage, metadata row, ingredients list, steps list, notes section, and Start Cooking CTA (rnr Button variant primary)
- [ ] Build Add Recipe screen `app/(stack)/recipes/new.tsx` using React Hook Form + Zod, `rnr` Input fields, reorderable ingredient and step rows, image picker, inline validation, and `rnr` Button for save/cancel
- [ ] Build Edit Recipe screen `app/(stack)/recipes/[id]/edit.tsx` pre-populated from existing recipe data using same form components
- [ ] Build Collections screen and Collection Detail screen using `rnr` Card list and recipe card list
- [ ] Build Search screen with `rnr` Input (auto-focused), recent searches list, active filter Badge chips with dismiss, and results list
- [ ] Build Settings screen with account section placeholder, sync status using `rnr` Card, and manual sync `rnr` Button
- [ ] Add EmptyState and Skeleton components to `shared/components/` using `rnr` Skeleton primitive
- [ ] Implement keep-screen-awake in cooking mode using expo-keep-awake
