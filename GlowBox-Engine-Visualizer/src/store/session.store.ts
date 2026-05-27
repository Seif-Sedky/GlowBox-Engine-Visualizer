import { create } from 'zustand';
import { BPlusTree } from '../engine/structures/bplus-tree';
import { ExtendibleHash } from '../engine/structures/extendible-hash';
import { RTree } from '../engine/structures/r-tree';
import { InvertedIndex } from '../engine/structures/inverted-index';

export type TreeState = BPlusTree | ExtendibleHash | RTree | InvertedIndex | any;

interface SessionState {
  operationHistory: string[];
  currentTreeState: TreeState | null;
  
  addOperation: (op: string) => void;
  setTreeState: (tree: TreeState) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  operationHistory: [],
  currentTreeState: null,
  
  addOperation: (op) => set((state) => ({ operationHistory: [...state.operationHistory, op] })),
  setTreeState: (tree) => set({ currentTreeState: tree }),
  clearSession: () => set({ operationHistory: [], currentTreeState: null }),
}));
