// Web stub — expo-sqlite requires SharedArrayBuffer which is unavailable
// without cross-origin isolation headers. SQLite is not used on web.

export function getDb(): never {
  throw new Error('SQLite is not available on web')
}

export async function runMigrations(): Promise<void> {
  // no-op on web
}
