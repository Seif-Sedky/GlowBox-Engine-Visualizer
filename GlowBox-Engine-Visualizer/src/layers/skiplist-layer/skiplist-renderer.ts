import { SkipList, SkipListNode } from '../../engine/structures/skip-list';

export interface LayoutCell {
  level: number;
  y: number;
}

export interface LayoutNode {
  id: string;
  isHead: boolean;
  value: number;
  x: number;
  y: number;
  cells: LayoutCell[];
}

export interface LayoutLink {
  id: string; // sourceId-targetId-level
  sourceId: string;
  targetId: string;
  level: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface SkipListLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
}

export class SkipListRenderer {
  public CELL_W = 60;
  public CELL_H = 30;
  public MARGIN_X = 80;

  computeLayout(tree: SkipList): SkipListLayout {
    const nodes: SkipListNode[] = [];
    let curr: SkipListNode | null = tree.head;
    while (curr) {
      nodes.push(curr);
      curr = curr.forward[0] as SkipListNode | null;
    }

    const layoutNodes: LayoutNode[] = [];
    const layoutLinks: LayoutLink[] = [];

    // Base Y is 0. SkipListLayer will center it vertically.
    const baseY = 0;

    const nodePositions = new Map<string, { x: number, y: number }>();
    nodes.forEach((node, i) => {
      nodePositions.set(node.id, {
        x: i * (this.CELL_W + this.MARGIN_X),
        y: baseY
      });
    });

    nodes.forEach(node => {
      const pos = nodePositions.get(node.id)!;
      const cells: LayoutCell[] = [];
      for (let l = 0; l < node.forward.length; l++) {
        cells.push({
          level: l,
          y: - (l * this.CELL_H) - this.CELL_H
        });
      }

      layoutNodes.push({
        id: node.id,
        isHead: node.id === 'head',
        value: node.value,
        x: pos.x,
        y: pos.y,
        cells
      });

      for (let l = 0; l < node.forward.length; l++) {
        const targetNode = node.forward[l];
        if (targetNode) {
          const targetPos = nodePositions.get(targetNode.id)!;
          layoutLinks.push({
            id: `${node.id}-${targetNode.id}-${l}`,
            sourceId: node.id,
            targetId: targetNode.id,
            level: l,
            sourceX: pos.x + this.CELL_W,
            sourceY: pos.y - (l * this.CELL_H) - (this.CELL_H / 2),
            targetX: targetPos.x,
            targetY: targetPos.y - (l * this.CELL_H) - (this.CELL_H / 2)
          });
        }
      }
    });

    return { nodes: layoutNodes, links: layoutLinks };
  }
}
