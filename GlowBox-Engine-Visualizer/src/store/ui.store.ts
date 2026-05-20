import { create } from 'zustand'
import type { ThemeId } from './theme.types'
import { useSessionStore } from './session.store'

export type AppScreen = 'landing' | 'index-picker' | 'visualizer'
export type IndexType = 'bplus' | 'hash' | 'rtree'

export interface HashInfoEntry {
  type: 'hash-info'
  key: number
  binaryKey: string
  lsbBits: string
  bucketIndex: number
  globalDepth: number
}

export interface TextEntry {
  type: 'text'
  message: string
}

export type StepLogEntry = HashInfoEntry | TextEntry

interface UIState {
  screen: AppScreen
  theme: ThemeId
  speed: number          // 0.25 – 3.0  (GSAP timeScale multiplier)
  annotationsOn: boolean
  maxKeys: number        // 2, 4, 6, 8
  minKeys: number        // 1, 2, 3, 4
  indexType: IndexType
  stepLog: StepLogEntry[]

  setScreen: (s: AppScreen) => void
  setTheme: (t: ThemeId) => void
  setSpeed: (v: number) => void
  toggleAnnotations: () => void
  setMaxKeys: (v: number) => void
  setMinKeys: (v: number) => void
  setIndexType: (i: IndexType) => void
  setStepLog: (log: StepLogEntry[]) => void
}

export const useUIStore = create<UIState>((set) => ({
  screen:         'landing',
  theme:          'nebula',
  speed:          1,
  annotationsOn:  false,
  maxKeys:        4,
  minKeys:        2,
  indexType:      'bplus',
  stepLog:        [],

  setScreen:  (screen) => {
    // Auto-clear session when leaving the visualizer
    const currentScreen = useUIStore.getState().screen;
    if (currentScreen === 'visualizer' && screen !== 'visualizer') {
      useSessionStore.getState().clearSession();
      set({ stepLog: [] });
    }
    set({ screen });
  },
  setTheme:   (theme)   => set({ theme }),
  setSpeed:   (speed)   => set({ speed }),
  toggleAnnotations: () =>
    set((s) => ({ annotationsOn: !s.annotationsOn })),
  setMaxKeys: (maxKeys) => set({ maxKeys }),
  setMinKeys: (minKeys) => set({ minKeys }),
  setIndexType: (indexType) => {
    useSessionStore.getState().clearSession();
    set({ indexType, stepLog: [] });
  },
  setStepLog: (stepLog) => set({ stepLog }),
}))
