# Planning & Design Document

## Feature 1: Migrate Web Persistence from localStorage to expo-sqlite/web

### Background

The app currently uses localStorage-based stubs for web persistence while native platforms use expo-sqlite. This creates two separate code paths and limits web storage to ~5-10MB with no relational query support.

### Goal

Unify the storage layer so web and native share the same SQLite-based repositories, eliminating platform-specific repository implementations.

### Research: expo-sqlite on Web

**How it works:** Starting with Expo SDK 52, `expo-sqlite` supports web via the [Origin Private File System (OPFS)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) as the storage backend. It uses `wa-sqlite` (WebAssembly SQLite) under the hood with an OPFS VFS (Virtual File System) for persistence.

**Browser Compatibility:**
- ✅ Chrome/Edge 86+ (full OPFS support)
- ✅ Firefox 111+ (full OPFS support)
- ✅ Safari 15.2+ (OPFS supported, but with caveats — no `createSyncAccessHandle` in main thread; requires worker)
- ⚠️ Safari/iOS may have storage eviction under pressure
- ❌ Older browsers have no OPFS support — no fallback is built in

**Required Configuration:**
- Must set specific headers for cross-origin isolation if using shared workers:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- Vercel config (`vercel.json`) needs these headers added
- No additional Expo config plugin needed for web

**Stability Assessment:**
- OPFS is a W3C standard, well-supported in modern browsers
- `wa-sqlite` is mature and actively maintained
- expo-sqlite/web is relatively new (SDK 52, ~late 2024) — less battle-tested than native
- Suitable for production with modern browser targeting; consider a localStorage fallback for unsupported browsers

### Migration Path

1. **Add required headers** to `vercel.json` for OPFS/SharedArrayBuffer support
2. **Remove `index.web.ts` repository stubs** — the existing native `index.ts` repositories should work on web once expo-sqlite/web is active
3. **Data migration**: On first load after deployment, read any existing localStorage data and insert it into SQLite, then clear localStorage flag
4. **Test thoroughly** on Chrome, Firefox, Safari
5. **Optional**: Add a capability check — if OPFS is unavailable, fall back to localStorage stubs with a warning

### Task: Browser Compatibility Gate

**Summary:** On app load, detect whether the browser supports OPFS (required for expo-sqlite/web). If not supported, block the entire UI and show a clear unsupported-browser message.

**Detection Logic:**
- Check for `navigator.storage?.getDirectory` (OPFS API availability)
- Verify the app is running in a secure context (`window.isSecureContext`) with cross-origin isolation (`window.crossOriginIsolated`)
- If either check fails → browser is unsupported

**Unsupported Browser Behavior:**
- Render a full-screen "Browser Not Supported" message
- No other UI should be shown — no navigation, no forms, no app shell. Just the message.
- The message should list compatible browsers:
  - Chrome 86+
  - Edge 86+
  - Firefox 111+
  - Safari 15.2+
- Note that Firefox private browsing mode is **not supported** (OPFS is unavailable in private windows)

**Implementation:**
- Create a `BrowserCompatibilityGate` React component at `components/BrowserCompatibilityGate.tsx`
- This component wraps the app root in `app/_layout.tsx`
- On mount, run the OPFS capability checks
- If supported → render `children`
- If not supported → render the unsupported message (styled as a centered, full-screen overlay)
- Create an `UnsupportedBrowserScreen` component at `components/UnsupportedBrowserScreen.tsx` for the message UI

**Files to create/modify:**
- `components/BrowserCompatibilityGate.tsx` — gate component with detection logic
- `components/UnsupportedBrowserScreen.tsx` — the unsupported browser message UI
- `app/_layout.tsx` — wrap root layout with the gate component
- `utils/checkBrowserCompatibility.ts` — pure function for the OPFS/secure-context checks (testable in isolation)

**Acceptance Criteria:**
- [ ] On supported browsers (Chrome 86+, Edge 86+, Firefox 111+, Safari 15.2+), the app loads normally
- [ ] On unsupported browsers, a full-screen message is shown with no other UI visible
- [ ] The message lists compatible browsers and notes Firefox private browsing is unsupported
- [ ] The detection check runs before any SQLite initialization
- [ ] The gate component is platform-aware — on native (iOS/Android), it always renders children (OPFS check is web-only)
- [ ] The compatibility check function has unit tests

### Risks and Caveats

- **Cross-origin headers** may break third-party embeds/scripts (e.g., analytics, auth popups) — test carefully
- **Safari quirks**: OPFS access handle limitations may cause issues; needs testing on iOS Safari
- **Storage eviction**: Unlike native SQLite, browser storage can be evicted under storage pressure (mitigated by requesting `navigator.storage.persist()`)
- **No SSR**: SQLite is client-only; ensure no server-side rendering attempts access the DB
- **Bundle size**: wa-sqlite WASM adds ~300-400KB to the web bundle

### Acceptance Criteria

- [ ] Web app uses expo-sqlite (OPFS backend) for all data persistence
- [ ] `index.web.ts` localStorage stubs are removed
- [ ] Existing localStorage data is migrated on first load
- [ ] App works correctly on Chrome, Firefox, and Safari (latest versions)
- [ ] Vercel deployment configured with required headers
- [ ] Graceful degradation or clear error for unsupported browsers

---

## Feature 2: Authentication with Google Login

### Background

The app currently has no user accounts. Adding authentication enables user-scoped data, cloud sync, and multi-device access.

### Goal

Implement user login/registration with Google OAuth as the primary method, supporting both native (iOS/Android) and web platforms.

### Technical Approach

#### Authentication Method: Google OAuth 2.0

**Web:**
- Use [Google Identity Services (GIS)](https://developers.google.com/identity/gsi/web) — the modern "Sign in with Google" button/One Tap
- Returns an ID token (JWT) that can be verified server-side
- No popups blocked by cross-origin policies (unlike older OAuth flows)

**Native (iOS/Android):**
- Use `expo-auth-session` with Google provider, OR
- Use `@react-native-google-signin/google-signin` for a more native experience
- Both return an ID token compatible with backend verification

#### Account Creation Flow

1. User taps "Sign in with Google"
2. Google OAuth flow completes → app receives ID token
3. ID token sent to backend API for verification
4. Backend creates/finds user account (email as unique identifier)
5. Backend returns session token (JWT) to client
6. Client stores session token securely (`expo-secure-store` on native, httpOnly cookie or secure storage on web)

#### Session Management

- **Access token**: Short-lived JWT (15-60 min), stored in memory
- **Refresh token**: Long-lived, stored securely (secure-store native / httpOnly cookie web)
- **Token refresh**: Silent refresh before expiry; on failure, redirect to login
- **Logout**: Clear tokens client-side, invalidate refresh token server-side

#### Backend Requirements

- API endpoint for token verification and session creation (`POST /auth/google`)
- User table in database (id, email, name, avatar_url, created_at)
- JWT signing/verification for session tokens
- Options: Supabase Auth (managed), Firebase Auth, or custom backend

#### Integration with Recipe Data

- Add `user_id` column to recipes table
- Recipes are scoped to authenticated user
- Unauthenticated usage: recipes stored locally only (current behavior)
- On first login: offer to "claim" existing local recipes into the user's account
- Future: cloud sync between devices for authenticated users

#### Platform Considerations

| Concern | Web | Native |
|---------|-----|--------|
| OAuth flow | GIS popup/redirect | AuthSession/native SDK |
| Token storage | httpOnly cookie / localStorage | expo-secure-store |
| Session persistence | Cookie or token in memory + refresh | Secure store |
| Deep linking | Redirect URI = app URL | Expo linking scheme |

### Risks and Caveats

- **Google Cloud Console setup** required (OAuth client IDs for web + iOS + Android)
- **Cross-origin headers** (from Feature 1) may conflict with Google OAuth popups — test carefully
- **App Store review**: Google Sign-In on iOS also requires Apple Sign-In to be offered (App Store guideline 4.8)
- **Data migration**: Existing anonymous local data needs a "claim" flow on first auth
- **Backend dependency**: Requires a backend service (could use Supabase/Firebase to minimize custom work)

### Acceptance Criteria

- [ ] Users can sign in with Google on web and native
- [ ] New accounts are created automatically on first sign-in
- [ ] Session persists across app restarts (token refresh works)
- [ ] Recipes are scoped to authenticated user
- [ ] Existing local recipes can be claimed on first login
- [ ] Logout clears session and returns to unauthenticated state
- [ ] Works on iOS, Android, and web
- [ ] Apple Sign-In offered alongside Google on iOS (App Store requirement)

---

## Implementation Priority

1. **Feature 1 (SQLite/web)** — Lower complexity, no backend needed, immediate DX benefit of unified code
2. **Feature 2 (Auth)** — Higher complexity, requires backend infrastructure, but enables cloud sync and multi-device

## Open Questions

- Should we use a managed auth service (Supabase/Firebase) or build custom?
- Do we need offline-first sync (e.g., PowerSync, ElectricSQL) once auth is in place?
- Should Feature 1 block on Feature 2, or can they be done in parallel?
