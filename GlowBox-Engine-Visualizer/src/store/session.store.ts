import { create } from 'zustand';

interface SessionState {
  operationHistory: string[];
  currentTreeState: unknown; // Placeholder for the actual structure state
  
  addOperation: (op: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  operationHistory: [],
  currentTreeState: null,
  
  addOperation: (op) => set((state) => ({ operationHistory: [...state.operationHistory, op] })),
  clearSession: () => set({ operationHistory: [], currentTreeState: null }),
}));
