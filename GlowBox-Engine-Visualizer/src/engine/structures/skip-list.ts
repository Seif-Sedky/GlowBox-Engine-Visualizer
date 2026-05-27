import { Diff } from '../diff.types';

export class SkipListNode {
  id: string;
  value: number;
  forward: (SkipListNode | null)[];

  constructor(id: string, value: number, level: number) {
    this.id = id;
    this.value = value;
    this.forward = new Array(level).fill(null);
  }
}

export class SkipList {
  head: SkipListNode;
  maxLevel: number;
  p: number;
  level: number;

  private nextNodeId = 1;

  constructor(maxLevel: number = 6, p: number = 0.5) {
    this.maxLevel = maxLevel;
    this.p = p;
    this.level = 1;
    this.head = new SkipListNode('head', -Infinity, maxLevel);
  }

  private randomLevel(diffs: Diff[]): number {
    let lvl = 1;
    while (Math.random() < this.p && lvl < this.maxLevel) {
      diffs.push({
        type: 'SL_COIN_FLIP',
        payload: { success: true },
        annotation: `Coin flip: Heads! Promoting to level ${lvl + 1}`
      });
      lvl++;
    }
    if (lvl < this.maxLevel) {
       diffs.push({
         type: 'SL_COIN_FLIP',
         payload: { success: false },
         annotation: `Coin flip: Tails. Stopping at level ${lvl}`
       });
    }
    return lvl;
  }

  insert(value: number): Diff[] {
    const diffs: Diff[] = [];
    const update: SkipListNode[] = new Array(this.maxLevel).fill(this.head);
    let current = this.head;

    diffs.push({
      type: 'ANNOTATION',
      annotation: `Inserting value ${value}`
    });

    for (let i = this.level - 1; i >= 0; i--) {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Scanning level ${i + 1}. Current value: ${current.value === -Infinity ? 'HEAD' : current.value}`
      });
      
      while (current.forward[i] && current.forward[i]!.value < value) {
        const nextVal = current.forward[i]!.value;
        diffs.push({
          type: 'ANNOTATION',
          annotation: `${nextVal} < ${value}, moving right on level ${i + 1}`
        });
        current = current.forward[i]!;
      }
      
      if (i > 0) {
        const nextVal = current.forward[i] ? current.forward[i]!.value : 'null';
        diffs.push({
          type: 'ANNOTATION',
          annotation: `${nextVal} >= ${value} (or null), dropping down to level ${i}`
        });
      }
      
      update[i] = current;
    }

    current = current.forward[0] as any;

    if (current && current.value === value) {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Value ${value} already exists.`
      });
      return diffs;
    }

    const newLevel = this.randomLevel(diffs);
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) {
        update[i] = this.head;
      }
      this.level = newLevel;
    }

    const newNode = new SkipListNode(`node_${this.nextNodeId++}`, value, newLevel);
    
    diffs.push({
      type: 'SL_NODE_CREATE',
      payload: { nodeId: newNode.id, value, level: newLevel },
      annotation: `Created new node for ${value} with height ${newLevel}`
    });

    for (let i = 0; i < newLevel; i++) {
      newNode.forward[i] = update[i].forward[i];
      update[i].forward[i] = newNode;

      diffs.push({
        type: 'SL_LINK_UPDATE',
        payload: { sourceId: update[i].id, targetId: newNode.id, level: i },
        annotation: `Linked level ${i + 1}`
      });
    }

    diffs.push({
      type: 'ANNOTATION',
      annotation: `Finished inserting ${value}`,
      snapshot: this.clone()
    });

    return diffs;
  }

  search(value: number): Diff[] {
    const diffs: Diff[] = [];
    let current = this.head;

    diffs.push({
      type: 'ANNOTATION',
      annotation: `Searching for value ${value}`
    });

    for (let i = this.level - 1; i >= 0; i--) {
      diffs.push({
        type: 'SL_NODE_HIGHLIGHT',
        payload: { nodeId: current.id, level: i },
        annotation: `Checking level ${i + 1}. Current: ${current.value === -Infinity ? 'HEAD' : current.value}`
      });
      while (current.forward[i] && current.forward[i]!.value < value) {
        const nextVal = current.forward[i]!.value;
        diffs.push({
          type: 'SL_NODE_HIGHLIGHT',
          payload: { nodeId: current.id, level: i },
          annotation: `${nextVal} < ${value}, moving right on level ${i + 1}`
        });
        current = current.forward[i]!;
      }
      
      if (i > 0) {
        const nextVal = current.forward[i] ? current.forward[i]!.value : 'null';
        diffs.push({
          type: 'SL_NODE_HIGHLIGHT',
          payload: { nodeId: current.id, level: i },
          annotation: `${nextVal} >= ${value} (or null), dropping down to level ${i}`
        });
      }
    }

    current = current.forward[0] as any;
    
    if (current && current.value === value) {
      diffs.push({
        type: 'SL_NODE_HIGHLIGHT',
        payload: { nodeId: current.id, level: 0, highlightTarget: true },
        annotation: `Found value ${value}!`
      });
    } else {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Value ${value} not found.`
      });
    }

    diffs.push({
      type: 'SL_CLEAR_HIGHLIGHT'
    });

    return diffs;
  }

  delete(value: number): Diff[] {
    const diffs: Diff[] = [];
    const update: SkipListNode[] = new Array(this.maxLevel).fill(this.head);
    let current = this.head;

    diffs.push({
      type: 'ANNOTATION',
      annotation: `Deleting value ${value}`
    });

    for (let i = this.level - 1; i >= 0; i--) {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Scanning level ${i + 1}. Current: ${current.value === -Infinity ? 'HEAD' : current.value}`
      });
      while (current.forward[i] && current.forward[i]!.value < value) {
        const nextVal = current.forward[i]!.value;
        diffs.push({
          type: 'ANNOTATION',
          annotation: `${nextVal} < ${value}, moving right on level ${i + 1}`
        });
        current = current.forward[i]!;
      }
      
      if (i > 0) {
        const nextVal = current.forward[i] ? current.forward[i]!.value : 'null';
        diffs.push({
          type: 'ANNOTATION',
          annotation: `${nextVal} >= ${value} (or null), dropping down to level ${i}`
        });
      }
      
      update[i] = current;
    }

    current = current.forward[0] as any;

    if (current && current.value === value) {
      for (let i = 0; i < this.level; i++) {
        if (update[i].forward[i] !== current) {
          break;
        }
        update[i].forward[i] = current.forward[i];
        diffs.push({
          type: 'SL_LINK_UPDATE',
          payload: { sourceId: update[i].id, targetId: current.forward[i]?.id || null, level: i },
          annotation: `Unlinked level ${i + 1} from ${value}`
        });
      }

      while (this.level > 1 && this.head.forward[this.level - 1] === null) {
        this.level--;
      }

      diffs.push({
        type: 'ANNOTATION',
        annotation: `Deleted value ${value}`,
        snapshot: this.clone()
      });
    } else {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Value ${value} not found for deletion.`
      });
    }

    return diffs;
  }

  // Clones the tree for snapshot visualization
  clone(): any {
    // Custom deep clone because of linked list cycles/references
    const cloneHead = new SkipListNode(this.head.id, this.head.value, this.maxLevel);
    const nodeMap = new Map<SkipListNode, SkipListNode>();
    nodeMap.set(this.head, cloneHead);

    let curr = this.head.forward[0];
    
    // First pass: create all nodes
    while (curr) {
      const newNode = new SkipListNode(curr.id, curr.value, curr.forward.length);
      nodeMap.set(curr, newNode);
      curr = curr.forward[0];
    }

    // Second pass: wire all links at all levels
    curr = this.head;
    while (curr) {
      const cloned = nodeMap.get(curr)!;
      for (let i = 0; i < curr.forward.length; i++) {
        const next = curr.forward[i];
        if (next) {
          cloned.forward[i] = nodeMap.get(next)!;
        } else {
          cloned.forward[i] = null;
        }
      }
      curr = curr.forward[0] as any;
    }

    const clonedList = new SkipList(this.maxLevel, this.p);
    clonedList.head = cloneHead;
    clonedList.level = this.level;
    clonedList.nextNodeId = this.nextNodeId;
    return clonedList;
  }
}
