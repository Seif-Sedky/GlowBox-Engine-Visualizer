import { create } from 'zustand';
export const useUIStore = create((set) => ({
    screen: 'landing',
    theme: 'nebula',
    speed: 1,
    annotationsOn: false,
    maxKeys: 4,
    minKeys: 2,
    indexType: 'bplus',
    setScreen: (screen) => set({ screen }),
    setTheme: (theme) => set({ theme }),
    setSpeed: (speed) => set({ speed }),
    toggleAnnotations: () => set((s) => ({ annotationsOn: !s.annotationsOn })),
    setMaxKeys: (maxKeys) => set({ maxKeys }),
    setMinKeys: (minKeys) => set({ minKeys }),
    setIndexType: (indexType) => set({ indexType }),
}));
//# sourceMappingURL=ui.store.js.map