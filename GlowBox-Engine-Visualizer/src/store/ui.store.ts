import { create } from 'zustand'
import type { ThemeId } from './theme.types'

export type AppScreen = 'landing' | 'index-picker' | 'visualizer'
export type IndexType = 'bplus' | 'hash' | 'rtree'

interface UIState {
  screen: AppScreen
  theme: ThemeId
  speed: number          // 0.25 – 3.0  (GSAP timeScale multiplier)
  annotationsOn: boolean
  maxKeys: number        // 2, 4, 6, 8
  minKeys: number        // 1, 2, 3, 4
  indexType: IndexType

  setScreen: (s: AppScreen) => void
  setTheme: (t: ThemeId) => void
  setSpeed: (v: number) => void
  toggleAnnotations: () => void
  setMaxKeys: (v: number) => void
  setMinKeys: (v: number) => void
  setIndexType: (i: IndexType) => void
}

export const useUIStore = create<UIState>((set) => ({
  screen:         'landing',
  theme:          'nebula',
  speed:          1,
  annotationsOn:  false,
  maxKeys:        4,
  minKeys:        2,
  indexType:      'bplus',

  setScreen:  (screen)  => set({ screen }),
  setTheme:   (theme)   => set({ theme }),
  setSpeed:   (speed)   => set({ speed }),
  toggleAnnotations: () =>
    set((s) => ({ annotationsOn: !s.annotationsOn })),
  setMaxKeys: (maxKeys) => set({ maxKeys }),
  setMinKeys: (minKeys) => set({ minKeys }),
  setIndexType: (indexType) => set({ indexType }),
}))
