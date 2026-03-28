import { create } from 'zustand'

interface SyncStatus {
  lastSyncedAt: string | null
  pendingCount: number
  failedCount: number
  isSyncing: boolean
}

interface SyncStore extends SyncStatus {
  setSyncStatus: (status: Partial<SyncStatus>) => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  lastSyncedAt: null,
  pendingCount: 0,
  failedCount: 0,
  isSyncing: false,
  setSyncStatus: (status) => set(status),
}))
