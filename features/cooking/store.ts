import { create } from 'zustand'
import { ActiveCookingSession, TimerState } from '../../shared/types'

interface CookingStore {
  session: ActiveCookingSession | null
  currentStepIndex: number
  timers: Record<string, TimerState>
  setSession: (session: ActiveCookingSession | null) => void
  setCurrentStep: (index: number) => void
  startTimer: (stepId: string, totalSeconds: number) => void
  cancelTimer: (stepId: string) => void
  clearSession: () => void
}

export const useCookingStore = create<CookingStore>((set) => ({
  session: null,
  currentStepIndex: 0,
  timers: {},
  setSession: (session) => set({ session }),
  setCurrentStep: (currentStepIndex) => set({ currentStepIndex }),
  startTimer: (stepId, totalSeconds) =>
    set((state) => ({
      timers: {
        ...state.timers,
        [stepId]: { stepId, totalSeconds, remainingSeconds: totalSeconds, running: true },
      },
    })),
  cancelTimer: (stepId) =>
    set((state) => {
      const { [stepId]: _removed, ...rest } = state.timers
      return { timers: rest }
    }),
  clearSession: () => set({ session: null, currentStepIndex: 0, timers: {} }),
}))
