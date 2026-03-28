# Sync, Auth, and Media

> Context: Personal recipe catalogue app. Stack: React Native + Expo, TypeScript, Expo Router, Zustand, SQLite (Expo SQLite), Supabase, Zod, React Hook Form, NativeWind. See 00-master-spec.md for full constraints. Data model in 03-data-model-and-storage.md.

## Goal
Allow recipes and images to sync across devices without compromising offline-first behavior. Auth is optional — the app must work fully without an account.

## Auth

### Supabase Auth Integration
- Use Supabase email/password and optionally OAuth (Google/Apple)
- Anonymous local-only mode: app is fully functional without sign-in
- On sign-in: trigger initial full sync (push local, pull remote)
- On sign-out: retain local data, stop sync

### Auth Store
```typescript
interface AuthStore {
  session: Session | null
  user: User | null
  isLoading: boolean
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  restoreSession(): Promise<void>
}
```

## Supabase Schema
Remote tables mirror local SQLite structure with additions:
- `user_id` column on `recipes`, `collections` for multi-user isolation
- Row Level Security (RLS) policies: users can only read/write their own records
- `deleted_at` column on `recipes` for tombstone sync

RLS policy example for recipes:
```sql
CREATE POLICY "Users see own recipes" ON recipes
  FOR ALL USING (auth.uid() = user_id);
```

## Sync Strategy (MVP: Last-Write-Wins)
```
Push:
  1. Read all sync_queue entries with status = 'pending'
  2. For each entry, upsert/delete to Supabase
  3. On success: mark entry as processed (delete or status = 'done')
  4. On failure: increment retry_count, set last_error, mark 'failed'

Pull:
  1. Read last_synced_at watermark from local preferences
  2. Query Supabase for records with updated_at > watermark
  3. For each remote record: upsert into SQLite if remote is newer
  4. Update last_synced_at watermark

Trigger sync:
  - On app foreground if authenticated and online
  - After each successful local write (debounced, 30s)
  - Manual retry from Settings screen
```

## Sync Queue Fields
```typescript
interface SyncQueueEntry {
  id: string
  entityType: 'recipe' | 'ingredient' | 'step' | 'tag' | 'collection'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: string       // JSON snapshot of entity at time of mutation
  createdAt: string
  retryCount: number
  lastError: string | null
  status: 'pending' | 'failed'
}
```

## Media Handling
- Local: store device file URI in `recipe.imageUri` immediately after pick
- Show local image in UI without waiting for upload
- Upload flow (background, during sync):
  1. Read local file from URI
  2. Compress using `expo-image-manipulator` (max 1200px, 80% quality)
  3. Upload to Supabase Storage at path `{userId}/{recipeId}/{filename}`
  4. On success: update `recipe.imageUri` to Supabase public URL, enqueue update sync entry
- Retain local file as fallback if remote URL is unavailable

## Failure Handling
- Local saves never blocked by sync failures
- Sync errors shown as status in Settings screen
- Failed queue entries auto-retry with exponential backoff (max 3 retries)
- After 3 failures: mark as 'failed', surface in Settings for manual action
- Network detection via `@react-native-community/netinfo` or equivalent

## Sync Status UI (Settings Screen)
- Last synced timestamp
- Pending items count
- Failed items count with error details
- "Sync Now" button (disabled when offline or unauthenticated)

## Implementation Tasks
- [ ] Create Supabase project, define remote schema (recipes, ingredients, steps, tags, recipe_tags, collections, collection_recipes) with user_id columns and RLS policies — output SQL migration file to `infra/sync/supabase-schema.sql`
- [ ] Implement auth store in `infra/auth/store.ts` with signIn, signUp, signOut, restoreSession using Supabase JS client, persisting session to SecureStore
- [ ] Build auth UI: sign-in screen (`app/(stack)/auth/sign-in.tsx`) and sign-up screen (`app/(stack)/auth/sign-up.tsx`) with React Hook Form + Zod validation and Supabase error handling
- [ ] Implement `SyncQueueRepository` in `infra/db/repositories/sync-queue-repository.ts` with enqueue, dequeuePending, markFailed, clearCompleted
- [ ] Implement `SyncProcessor` in `infra/sync/sync-processor.ts` that processes push (upsert/delete to Supabase) and pull (fetch by updatedAt watermark, upsert to SQLite) — handles retry logic and error recording
- [ ] Wire SyncProcessor to trigger on app foreground (AppState change) and after writes (debounced 30s) when authenticated and online
- [ ] Implement image upload service in `infra/storage/image-upload.ts` using expo-image-manipulator for compression and Supabase Storage for upload, updating recipe imageUri on success
- [ ] Add sync status Zustand slice in `infra/sync/store.ts` exposing lastSyncedAt, pendingCount, failedCount, isSyncing, and manual triggerSync action
- [ ] Wire Settings screen sync status section to sync store
- [ ] Add integration tests for: offline mutation → online sync replay (push), remote update pull with watermark, image upload with URI update, auth sign-in → sync trigger
