import { Diff } from '../diff.types';

export interface SSTableEntry {
  key: number;
  isTombstone: boolean;
  timestamp: number;
}

export class SSTable {
  entries: SSTableEntry[];
  id: string;

  constructor(entries: SSTableEntry[], id: string) {
    this.entries = entries;
    this.id = id;
  }
}

export class AVLTreeNode {
  key: number;
  isTombstone: boolean;
  timestamp: number;
  height: number;
  left: AVLTreeNode | null = null;
  right: AVLTreeNode | null = null;
  id: string;

  constructor(key: number, isTombstone: boolean, timestamp: number) {
    this.key = key;
    this.isTombstone = isTombstone;
    this.timestamp = timestamp;
    this.height = 1;
    this.id = `avl_${key}`;
  }
}

export class LSMTree {
  memTableRoot: AVLTreeNode | null = null;
  memTableSize: number = 0;
  
  // Array of levels. levels[0] is Level 0 (array of SSTables)
  levels: SSTable[][] = [];
  
  memTableCapacity: number;
  compactionThreshold: number;
  
  private currentTimestamp: number = 0;
  private sstableCounter: number = 0;

  constructor(memTableCapacity: number = 4, compactionThreshold: number = 4) {
    this.memTableCapacity = Math.max(2, memTableCapacity);
    this.compactionThreshold = Math.max(2, compactionThreshold);
  }

  // AVL Helpers
  private getHeight(node: AVLTreeNode | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: AVLTreeNode | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private updateHeight(node: AVLTreeNode) {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  private rotateRight(y: AVLTreeNode): AVLTreeNode {
    const x = y.left!;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  private rotateLeft(x: AVLTreeNode): AVLTreeNode {
    const y = x.right!;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    this.updateHeight(x);
    this.updateHeight(y);
    return y;
  }

  private insertAVL(node: AVLTreeNode | null, key: number, isTombstone: boolean, timestamp: number, diffs: Diff[], isNewRef: {val: boolean}): AVLTreeNode {
    if (!node) {
      isNewRef.val = true;
      return new AVLTreeNode(key, isTombstone, timestamp);
    }

    if (key < node.key) {
      node.left = this.insertAVL(node.left, key, isTombstone, timestamp, diffs, isNewRef);
    } else if (key > node.key) {
      node.right = this.insertAVL(node.right, key, isTombstone, timestamp, diffs, isNewRef);
    } else {
      // Update existing key in memtable
      node.isTombstone = isTombstone;
      node.timestamp = timestamp;
      return node;
    }

    this.updateHeight(node);
    const balance = this.getBalance(node);

    // Left Left
    if (balance > 1 && key < node.left!.key) {
      return this.rotateRight(node);
    }
    // Right Right
    if (balance < -1 && key > node.right!.key) {
      return this.rotateLeft(node);
    }
    // Left Right
    if (balance > 1 && key > node.left!.key) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }
    // Right Left
    if (balance < -1 && key < node.right!.key) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  private flattenAVL(node: AVLTreeNode | null, result: SSTableEntry[]) {
    if (!node) return;
    this.flattenAVL(node.left, result);
    result.push({ key: node.key, isTombstone: node.isTombstone, timestamp: node.timestamp });
    this.flattenAVL(node.right, result);
  }

  insert(key: number, isTombstone: boolean = false): Diff[] {
    const diffs: Diff[] = [];
    const timestamp = ++this.currentTimestamp;

    diffs.push({
      type: 'ANNOTATION',
      annotation: isTombstone ? `Inserting tombstone for ${key} into MemTable` : `Inserting ${key} into MemTable`
    });

    const isNew = { val: false };
    this.memTableRoot = this.insertAVL(this.memTableRoot, key, isTombstone, timestamp, diffs, isNew);
    
    if (isNew.val) {
      this.memTableSize++;
    }

    diffs.push({
      type: 'LSM_MEMTABLE_INSERT',
      snapshot: this.clone()
    });

    if (this.memTableSize >= this.memTableCapacity) {
      this.flushMemTable(diffs);
    }

    return diffs;
  }

  delete(key: number): Diff[] {
    return this.insert(key, true);
  }

  private flushMemTable(diffs: Diff[]) {
    diffs.push({
      type: 'ANNOTATION',
      annotation: `MemTable reached capacity (${this.memTableCapacity}). Flushing to Level 0.`
    });

    const entries: SSTableEntry[] = [];
    this.flattenAVL(this.memTableRoot, entries);
    
    const newSSTable = new SSTable(entries, `sst_${this.sstableCounter++}`);
    
    // Clear memtable
    this.memTableRoot = null;
    this.memTableSize = 0;

    if (!this.levels[0]) this.levels[0] = [];
    // Insert at beginning to represent "newest" in L0
    this.levels[0].unshift(newSSTable);

    diffs.push({
      type: 'LSM_FLUSH',
      snapshot: this.clone()
    });

    this.checkCompaction(0, diffs);
  }

  private checkCompaction(levelIdx: number, diffs: Diff[]) {
    if (!this.levels[levelIdx]) return;

    if (this.levels[levelIdx].length >= this.compactionThreshold) {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Level ${levelIdx} reached threshold (${this.compactionThreshold}). Compacting to Level ${levelIdx + 1}.`
      });

      // Merge all SSTables in current level
      // We do a multi-way merge, prioritizing newer timestamps if keys match
      const allEntries = this.levels[levelIdx].flatMap(sst => sst.entries);
      
      // Sort by key ascending, then by timestamp descending
      allEntries.sort((a, b) => {
        if (a.key === b.key) return b.timestamp - a.timestamp;
        return a.key - b.key;
      });

      // Deduplicate and filter out tombstones if it's the last level (for simplicity, we always deduplicate)
      const merged: SSTableEntry[] = [];
      for (const entry of allEntries) {
        if (merged.length === 0 || merged[merged.length - 1].key !== entry.key) {
          // If we are merging into the LAST level, we could drop tombstones.
          // For visualization, let's keep tombstones unless we want to fully purge them.
          // Let's purge tombstones if they are old to save space.
          // Actually, standard LSM purges tombstones during compaction if there are no older versions.
          // We'll just drop tombstones if this is a compaction into a level > 0 and it's the only record.
          // To keep it simple visually: just keep all latest versions (even tombstones) unless we want to purge.
          // Let's purge tombstones to show the space saving!
          // We will ONLY purge a tombstone if we are compacting to the deepest level? No, let's just drop tombstones during merge to simulate cleanup.
          if (!entry.isTombstone) {
            merged.push(entry);
          }
        }
      }

      const newSSTable = new SSTable(merged, `sst_${this.sstableCounter++}`);
      
      // Clear current level
      this.levels[levelIdx] = [];
      
      // Push to next level
      if (!this.levels[levelIdx + 1]) this.levels[levelIdx + 1] = [];
      this.levels[levelIdx + 1].unshift(newSSTable);

      diffs.push({
        type: 'LSM_COMPACT',
        payload: { fromLevel: levelIdx, toLevel: levelIdx + 1 },
        snapshot: this.clone()
      });

      // Recursively check next level
      this.checkCompaction(levelIdx + 1, diffs);
    }
  }

  search(key: number): Diff[] {
    const diffs: Diff[] = [];
    
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Searching for ${key}. Checking MemTable first.`
    });

    // Check MemTable (AVL)
    let curr = this.memTableRoot;
    while (curr) {
      diffs.push({
        type: 'LSM_SEARCH_HIGHLIGHT',
        payload: { location: 'memtable', id: curr.id }
      });

      if (key === curr.key) {
        if (curr.isTombstone) {
          diffs.push({ type: 'ANNOTATION', annotation: `Found tombstone for ${key} in MemTable. Value is deleted.` });
        } else {
          diffs.push({ type: 'ANNOTATION', annotation: `Found ${key} in MemTable!` });
        }
        diffs.push({ type: 'LSM_CLEAR_HIGHLIGHT' });
        return diffs;
      } else if (key < curr.key) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }

    // Check Levels
    for (let l = 0; l < this.levels.length; l++) {
      if (this.levels[l].length === 0) continue;
      
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Not in MemTable. Scanning Level ${l} (Newest to Oldest).`
      });

      for (let sstIdx = 0; sstIdx < this.levels[l].length; sstIdx++) {
        const sst = this.levels[l][sstIdx];
        
        diffs.push({
          type: 'LSM_SEARCH_HIGHLIGHT',
          payload: { location: 'sstable', id: sst.id }
        });

        // Binary search in SSTable
        let left = 0;
        let right = sst.entries.length - 1;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const entry = sst.entries[mid];
          
          diffs.push({
            type: 'LSM_SEARCH_HIGHLIGHT',
            payload: { location: 'sstable_entry', sstId: sst.id, entryIndex: mid }
          });

          if (entry.key === key) {
            if (entry.isTombstone) {
              diffs.push({ type: 'ANNOTATION', annotation: `Found tombstone for ${key} in Level ${l}. Value is deleted.` });
            } else {
              diffs.push({ type: 'ANNOTATION', annotation: `Found ${key} in Level ${l}, SSTable ${sstIdx}!` });
            }
            diffs.push({ type: 'LSM_CLEAR_HIGHLIGHT' });
            return diffs;
          } else if (key < entry.key) {
            right = mid - 1;
          } else {
            left = mid + 1;
          }
        }
      }
    }

    diffs.push({
      type: 'ANNOTATION',
      annotation: `Value ${key} not found anywhere.`
    });
    
    diffs.push({ type: 'LSM_CLEAR_HIGHLIGHT' });
    return diffs;
  }

  clone(): LSMTree {
    const cloned = new LSMTree(this.memTableCapacity, this.compactionThreshold);
    cloned.currentTimestamp = this.currentTimestamp;
    cloned.sstableCounter = this.sstableCounter;
    cloned.memTableSize = this.memTableSize;

    // Clone AVL
    const cloneNode = (node: AVLTreeNode | null): AVLTreeNode | null => {
      if (!node) return null;
      const n = new AVLTreeNode(node.key, node.isTombstone, node.timestamp);
      n.height = node.height;
      n.id = node.id;
      n.left = cloneNode(node.left);
      n.right = cloneNode(node.right);
      return n;
    };
    cloned.memTableRoot = cloneNode(this.memTableRoot);

    // Clone Levels
    cloned.levels = this.levels.map(level => 
      level.map(sst => new SSTable([...sst.entries], sst.id))
    );

    return cloned;
  }
}
