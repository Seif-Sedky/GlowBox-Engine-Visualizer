import { create } from 'zustand'
import type { ThemeId } from './theme.types'

export type AppScreen = 'landing' | 'visualizer'

interface UIState {
  screen: AppScreen
  theme: ThemeId
  speed: number          // 0.25 – 3.0  (GSAP timeScale multiplier)
  annotationsOn: boolean
  pageSize: number       // bytes — drives node capacity

  setScreen: (s: AppScreen) => void
  setTheme: (t: ThemeId) => void
  setSpeed: (v: number) => void
  toggleAnnotations: () => void
  setPageSize: (v: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  screen:         'landing',
  theme:          'nebula',
  speed:          1,
  annotationsOn:  false,
  pageSize:       4096,

  setScreen:  (screen)  => set({ screen }),
  setTheme:   (theme)   => set({ theme }),
  setSpeed:   (speed)   => set({ speed }),
  toggleAnnotations: () =>
    set((s) => ({ annotationsOn: !s.annotationsOn })),
  setPageSize: (pageSize) => set({ pageSize }),
}))
