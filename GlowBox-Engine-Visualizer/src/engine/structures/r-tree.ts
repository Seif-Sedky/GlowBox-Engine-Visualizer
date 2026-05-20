import { Diff, DiffType } from '../diff.types';

let nextNodeId = 1;

export type MBR = [number, number, number, number]; // [minX, minY, maxX, maxY]

export interface RTreeEntry {
  mbr: MBR;
  child?: RTreeNode;
  point?: [number, number]; // For leaf nodes
}

export class RTreeNode {
  id: number;
  isLeaf: boolean;
  entries: RTreeEntry[];
  mbr: MBR;

  constructor(isLeaf: boolean) {
    this.id = nextNodeId++;
    this.isLeaf = isLeaf;
    this.entries = [];
    this.mbr = [Infinity, Infinity, -Infinity, -Infinity];
  }

  updateMBR() {
    this.mbr = [Infinity, Infinity, -Infinity, -Infinity];
    for (const e of this.entries) {
      this.mbr[0] = Math.min(this.mbr[0], e.mbr[0]);
      this.mbr[1] = Math.min(this.mbr[1], e.mbr[1]);
      this.mbr[2] = Math.max(this.mbr[2], e.mbr[2]);
      this.mbr[3] = Math.max(this.mbr[3], e.mbr[3]);
    }
  }

  clone(): RTreeNode {
    const node = new RTreeNode(this.isLeaf);
    node.id = this.id;
    node.mbr = [...this.mbr];
    node.entries = this.entries.map(e => ({
      mbr: [...e.mbr],
      point: e.point ? [...e.point] : undefined,
      child: e.child ? e.child.clone() : undefined
    }));
    return node;
  }
}

function calculateEnlargement(mbr: MBR, newMbr: MBR): number {
  const minX = Math.min(mbr[0], newMbr[0]);
  const minY = Math.min(mbr[1], newMbr[1]);
  const maxX = Math.max(mbr[2], newMbr[2]);
  const maxY = Math.max(mbr[3], newMbr[3]);
  const newArea = (maxX - minX) * (maxY - minY);
  const oldArea = (mbr[2] - mbr[0]) * (mbr[3] - mbr[1]);
  return newArea - oldArea;
}

export class RTree {
  root: RTreeNode;
  capacity: number;
  minEntries: number;

  constructor(maxEntries: number, minEntries: number = 2) {
    this.capacity = maxEntries;
    if (this.capacity < 2) {
      this.capacity = 2;
    }
    this.minEntries = minEntries;
    if (this.minEntries < 1) {
      this.minEntries = 1;
    }
    this.root = new RTreeNode(true);
  }

  clone(): RTree {
    const tree = new RTree(this.capacity, this.minEntries);
    tree.root = this.root.clone();
    return tree;
  }

  private createDiffArray(): Diff[] {
    const tree = this;
    const arr: Diff[] = [];
    const originalPush = arr.push.bind(arr);
    arr.push = function(...diffs: Diff[]) {
      const structuralTypes = ['NODE_CREATE', 'NODE_DELETE', 'NODE_SPLIT', 'KEY_INSERT', 'KEY_DELETE'];
      for (const diff of diffs) {
        if (structuralTypes.includes(diff.type)) {
          diff.snapshot = tree.clone();
        }
      }
      return originalPush(...diffs);
    };
    return arr;
  }

  insert(point: [number, number]): Diff[] {
    const diffs = this.createDiffArray();
    const mbr: MBR = [point[0], point[1], point[0], point[1]];

    diffs.push({
      type: 'ANNOTATION',
      annotation: `Inserting point [${point[0]}, ${point[1]}]`,
      payload: { point }
    });

    const splitNode = this._insertAt(this.root, { mbr, point }, diffs);

    if (splitNode) {
      const newRoot = new RTreeNode(false);
      
      const e1: RTreeEntry = { mbr: [...this.root.mbr], child: this.root };
      const e2: RTreeEntry = { mbr: [...splitNode.mbr], child: splitNode };
      
      newRoot.entries.push(e1, e2);
      newRoot.updateMBR();
      
      const oldRootId = this.root.id;
      this.root = newRoot;

      diffs.push({
        type: 'NODE_CREATE',
        payload: { nodeId: splitNode.id, isLeaf: splitNode.isLeaf }
      });
      diffs.push({
        type: 'NODE_SPLIT',
        payload: { sourceId: oldRootId, newId: splitNode.id, isLeaf: splitNode.isLeaf }
      });
      diffs.push({
        type: 'NODE_CREATE',
        payload: { nodeId: newRoot.id, isLeaf: false }
      });
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Root split. Created new root.`
      });
    }

    return diffs;
  }

  private _insertAt(node: RTreeNode, newEntry: RTreeEntry, diffs: Diff[]): RTreeNode | null {
    diffs.push({ type: 'NODE_HIGHLIGHT', payload: { nodeId: node.id } });

    if (node.isLeaf) {
      node.entries.push(newEntry);
      node.updateMBR();

      diffs.push({
        type: 'KEY_INSERT',
        payload: { nodeId: node.id, point: newEntry.point }
      });

      if (node.entries.length > this.capacity) {
        return this._splitNode(node, diffs);
      }
      return null;
    } else {
      // Find best child (minimum enlargement)
      let bestChildIdx = 0;
      let minEnlargement = Infinity;
      
      for (let i = 0; i < node.entries.length; i++) {
        const e = node.entries[i];
        const enl = calculateEnlargement(e.mbr, newEntry.mbr);
        if (enl < minEnlargement) {
          minEnlargement = enl;
          bestChildIdx = i;
        } else if (enl === minEnlargement) {
          const area1 = (e.mbr[2] - e.mbr[0]) * (e.mbr[3] - e.mbr[1]);
          const area2 = (node.entries[bestChildIdx].mbr[2] - node.entries[bestChildIdx].mbr[0]) * (node.entries[bestChildIdx].mbr[3] - node.entries[bestChildIdx].mbr[1]);
          if (area1 < area2) {
             bestChildIdx = i;
          }
        }
      }

      diffs.push({
        type: 'ANNOTATION',
        annotation: `Chose child ${bestChildIdx} (min enlargement)`,
        payload: { nodeId: node.id, childIndex: bestChildIdx }
      });

      const child = node.entries[bestChildIdx].child!;
      const splitNode = this._insertAt(child, newEntry, diffs);

      // Update MBR of the child entry
      node.entries[bestChildIdx].mbr = [...child.mbr];
      node.updateMBR();

      if (splitNode) {
        node.entries.push({ mbr: [...splitNode.mbr], child: splitNode });
        node.updateMBR();

        diffs.push({
          type: 'NODE_CREATE',
          payload: { nodeId: splitNode.id, isLeaf: splitNode.isLeaf }
        });
        diffs.push({
          type: 'NODE_SPLIT',
          payload: { sourceId: child.id, newId: splitNode.id, isLeaf: splitNode.isLeaf }
        });

        if (node.entries.length > this.capacity) {
          return this._splitNode(node, diffs);
        }
      }

      return null;
    }
  }

  // Simplified Linear Split with Min Capacity
  private _splitNode(node: RTreeNode, diffs: Diff[]): RTreeNode {
    // Pick two seeds that are furthest apart
    let maxDist = -1;
    let seed1 = 0;
    let seed2 = 1;

    for (let i = 0; i < node.entries.length; i++) {
      for (let j = i + 1; j < node.entries.length; j++) {
        const e1 = node.entries[i].mbr;
        const e2 = node.entries[j].mbr;
        const c1x = (e1[0] + e1[2]) / 2;
        const c1y = (e1[1] + e1[3]) / 2;
        const c2x = (e2[0] + e2[2]) / 2;
        const c2y = (e2[1] + e2[3]) / 2;
        const dist = Math.pow(c1x - c2x, 2) + Math.pow(c1y - c2y, 2);
        if (dist > maxDist) {
          maxDist = dist;
          seed1 = i;
          seed2 = j;
        }
      }
    }

    const newNode = new RTreeNode(node.isLeaf);
    const oldEntries = [...node.entries];
    const unassigned = oldEntries.filter((_, idx) => idx !== seed1 && idx !== seed2);
    
    node.entries = [oldEntries[seed1]];
    newNode.entries = [oldEntries[seed2]];

    while (unassigned.length > 0) {
      const remaining = unassigned.length;
      if (node.entries.length + remaining === this.minEntries) {
        node.entries.push(...unassigned);
        break;
      }
      if (newNode.entries.length + remaining === this.minEntries) {
        newNode.entries.push(...unassigned);
        break;
      }

      const e = unassigned.shift()!;
      node.updateMBR();
      newNode.updateMBR();
      
      const enl1 = calculateEnlargement(node.mbr, e.mbr);
      const enl2 = calculateEnlargement(newNode.mbr, e.mbr);
      
      if (enl1 < enl2) {
        node.entries.push(e);
      } else {
        newNode.entries.push(e);
      }
    }

    node.updateMBR();
    newNode.updateMBR();

    diffs.push({
      type: 'ANNOTATION',
      annotation: `Node capacity exceeded. Splitting into two.`
    });

    return newNode;
  }

  private _collectDataEntries(node: RTreeNode, dataEntries: [number, number][]) {
    if (node.isLeaf) {
      node.entries.forEach(e => dataEntries.push(e.point!));
    } else {
      node.entries.forEach(e => this._collectDataEntries(e.child!, dataEntries));
    }
  }

  delete(point: [number, number]): Diff[] {
    const diffs = this.createDiffArray();
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Deleting point [${point[0]}, ${point[1]}]`
    });

    const orphanedPoints: [number, number][] = [];
    const deleted = this._deleteAt(null, -1, this.root, point, orphanedPoints, diffs);
    if (!deleted) {
      diffs.push({ type: 'ANNOTATION', annotation: 'Point not found' });
    }

    // Reinsert orphaned entries
    if (orphanedPoints.length > 0) {
      diffs.push({ type: 'ANNOTATION', annotation: `Reinserting ${orphanedPoints.length} orphaned points to maintain minimum capacity` });
      for (const p of orphanedPoints) {
        const mbr: MBR = [p[0], p[1], p[0], p[1]];
        const splitNode = this._insertAt(this.root, { mbr, point: p }, diffs);
        if (splitNode) {
          const newRoot = new RTreeNode(false);
          const e1: RTreeEntry = { mbr: [...this.root.mbr], child: this.root };
          const e2: RTreeEntry = { mbr: [...splitNode.mbr], child: splitNode };
          newRoot.entries.push(e1, e2);
          newRoot.updateMBR();
          
          const oldRootId = this.root.id;
          this.root = newRoot;

          diffs.push({ type: 'NODE_CREATE', payload: { nodeId: splitNode.id, isLeaf: splitNode.isLeaf } });
          diffs.push({ type: 'NODE_SPLIT', payload: { sourceId: oldRootId, newId: splitNode.id, isLeaf: splitNode.isLeaf } });
          diffs.push({ type: 'NODE_CREATE', payload: { nodeId: newRoot.id, isLeaf: false } });
          diffs.push({ type: 'ANNOTATION', annotation: 'Root split during reinsertion.' });
        }
      }
    }

    if (!this.root.isLeaf && this.root.entries.length === 1) {
      this.root = this.root.entries[0].child!;
      diffs.push({ type: 'ANNOTATION', annotation: 'Root collapsed' });
    }

    return diffs;
  }

  private _deleteAt(parent: RTreeNode | null, childIndex: number, node: RTreeNode, point: [number, number], orphanedPoints: [number, number][], diffs: Diff[]): boolean {
    diffs.push({ type: 'NODE_HIGHLIGHT', payload: { nodeId: node.id } });

    if (node.isLeaf) {
      for (let i = 0; i < node.entries.length; i++) {
        const p = node.entries[i].point!;
        if (p[0] === point[0] && p[1] === point[1]) {
          node.entries.splice(i, 1);
          node.updateMBR();
          diffs.push({ type: 'KEY_DELETE', payload: { nodeId: node.id, point } });
          
          if (parent && node.entries.length < this.minEntries) {
            diffs.push({ type: 'ANNOTATION', annotation: `Node ${node.id} underflow. Eliminating node and gathering orphaned points.` });
            this._collectDataEntries(node, orphanedPoints);
            parent.entries.splice(childIndex, 1);
            parent.updateMBR();
            diffs.push({ type: 'NODE_DELETE', payload: { nodeId: node.id } });
          }
          return true;
        }
      }
      return false;
    } else {
      for (let i = 0; i < node.entries.length; i++) {
        const e = node.entries[i];
        if (point[0] >= e.mbr[0] && point[0] <= e.mbr[2] && point[1] >= e.mbr[1] && point[1] <= e.mbr[3]) {
          diffs.push({ type: 'ANNOTATION', annotation: `Following child ${i}` });
          const deleted = this._deleteAt(node, i, e.child!, point, orphanedPoints, diffs);
          if (deleted) {
            const stillExists = node.entries.includes(e);
            if (stillExists) {
              e.mbr = [...e.child!.mbr];
            }
            node.updateMBR();
            
            if (parent && node.entries.length < this.minEntries) {
              diffs.push({ type: 'ANNOTATION', annotation: `Node ${node.id} underflow. Eliminating node and gathering orphaned points.` });
              this._collectDataEntries(node, orphanedPoints);
              parent.entries.splice(childIndex, 1);
              parent.updateMBR();
              diffs.push({ type: 'NODE_DELETE', payload: { nodeId: node.id } });
            }
            return true;
          }
        }
      }
      return false;
    }
  }

  search(point: [number, number]): Diff[] {
    const diffs = this.createDiffArray();
    diffs.push({ type: 'ANNOTATION', annotation: `Searching for [${point[0]}, ${point[1]}]` });
    this._searchAt(this.root, point, diffs);
    return diffs;
  }

  private _searchAt(node: RTreeNode, point: [number, number], diffs: Diff[]): boolean {
    diffs.push({ type: 'NODE_HIGHLIGHT', payload: { nodeId: node.id } });

    if (node.isLeaf) {
      for (let i = 0; i < node.entries.length; i++) {
        const p = node.entries[i].point!;
        if (p[0] === point[0] && p[1] === point[1]) {
          diffs.push({ type: 'KEY_HIGHLIGHT', payload: { nodeId: node.id, point } });
          diffs.push({ type: 'ANNOTATION', annotation: 'Point found!' });
          return true;
        }
      }
      return false;
    } else {
      for (let i = 0; i < node.entries.length; i++) {
        const e = node.entries[i];
        if (point[0] >= e.mbr[0] && point[0] <= e.mbr[2] && point[1] >= e.mbr[1] && point[1] <= e.mbr[3]) {
          diffs.push({ type: 'ANNOTATION', annotation: `Checking child ${i}` });
          if (this._searchAt(e.child!, point, diffs)) {
            return true;
          }
        }
      }
      diffs.push({ type: 'ANNOTATION', annotation: 'Point not found' });
      return false;
    }
  }
}
