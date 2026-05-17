import { create } from 'zustand';
import { BPlusTree } from '../engine/structures/bplus-tree';

interface SessionState {
  operationHistory: string[];
  currentTreeState: BPlusTree | null;
  
  addOperation: (op: string) => void;
  setTreeState: (tree: BPlusTree) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  operationHistory: [],
  currentTreeState: null,
  
  addOperation: (op) => set((state) => ({ operationHistory: [...state.operationHistory, op] })),
  setTreeState: (tree) => set({ currentTreeState: tree }),
  clearSession: () => set({ operationHistory: [], currentTreeState: null }),
}));
