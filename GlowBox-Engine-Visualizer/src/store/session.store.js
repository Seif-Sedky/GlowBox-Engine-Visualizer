import { create } from 'zustand';
export const useSessionStore = create((set) => ({
    operationHistory: [],
    currentTreeState: null,
    addOperation: (op) => set((state) => ({ operationHistory: [...state.operationHistory, op] })),
    setTreeState: (tree) => set({ currentTreeState: tree }),
    clearSession: () => set({ operationHistory: [], currentTreeState: null }),
}));
//# sourceMappingURL=session.store.js.map