export type DiffType =
  | 'NODE_CREATE'
  | 'NODE_DELETE'
  | 'NODE_HIGHLIGHT'
  | 'NODE_SPLIT'
  | 'NODE_MERGE'
  | 'KEY_INSERT'
  | 'KEY_DELETE'
  | 'KEY_HIGHLIGHT'
  | 'POINTER_REDIRECT'
  | 'LEAF_LINK_UPDATE' // B+ tree leaf chain
  | 'BUCKET_SPLIT' // Extendible hash
  | 'DIRECTORY_EXPAND' // Extendible hash directory doubling
  | 'DOC_ADD' // Inverted index doc inserted
  | 'FST_NODE_CREATE' // Inverted index fst node added
  | 'FST_EDGE_CREATE' // Inverted index fst edge added
  | 'FST_NODE_HIGHLIGHT' // Inverted index fst path trace
  | 'POSTING_APPEND' // Inverted index posting list append
  | 'SL_NODE_CREATE' // Skip list node spawned
  | 'SL_LINK_UPDATE' // Skip list pointer update
  | 'SL_NODE_HIGHLIGHT' // Skip list traversal highlight
  | 'SL_CLEAR_HIGHLIGHT' // Skip list clear highlights after delay
  | 'SL_COIN_FLIP' // Skip list coin flip annotation
  | 'ANNOTATION'; // triggers a popup tooltip if annotations ON

export interface Diff {
  type: DiffType;
  payload?: any;
  annotation?: string; // shown only if annotationsOn === true
  durationHint?: number; // renderer scales by speed
  snapshot?: any; // A clone of the tree at this step
}
