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
  | 'ANNOTATION'; // triggers a popup tooltip if annotations ON

export interface Diff {
  type: DiffType;
  payload: Record<string, unknown>;
  annotation?: string; // shown only if annotationsOn === true
  durationHint?: number; // renderer scales by speed
}
