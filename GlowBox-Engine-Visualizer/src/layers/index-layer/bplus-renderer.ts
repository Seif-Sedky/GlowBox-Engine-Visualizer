import * as d3 from 'd3';
import { BPlusTree, BPlusNode } from '../../engine/structures/bplus-tree';

export interface LayoutNode {
  id: string; // "node_1"
  x: number;
  y: number;
  isLeaf: boolean;
  keys: number[];
  width: number;
  height: number;
  children: LayoutNode[];
}

export interface LayoutLink {
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export class BPlusRenderer {
  private treeLayout: d3.TreeLayout<BPlusNode>;
  private nodeWidth: number = 40; // width per key slot
  private nodeHeight: number = 50;
  private nodeGapX: number = 20;
  private nodeGapY: number = 80;

  constructor(capacity: number) {
    const maxNodeWidth = capacity * this.nodeWidth;
    this.treeLayout = d3.tree<BPlusNode>()
      .nodeSize([maxNodeWidth + this.nodeGapX, this.nodeHeight + this.nodeGapY]);
  }

  computeLayout(tree: BPlusTree): { nodes: LayoutNode[], links: LayoutLink[] } {
    // 1. Create D3 hierarchy
    const rootHierarchy = d3.hierarchy<BPlusNode>(tree.root, node => node.children || []);

    // 2. Compute tree layout
    const treeData = this.treeLayout(rootHierarchy);

    // 3. Extract layout nodes
    const layoutNodes: LayoutNode[] = [];
    const layoutLinks: LayoutLink[] = [];

    treeData.each(d => {
      const actualWidth = Math.max(1, d.data.keys.length) * this.nodeWidth;
      
      layoutNodes.push({
        id: `node_${d.data.id}`,
        x: d.x,
        y: d.y,
        isLeaf: d.data.isLeaf,
        keys: [...d.data.keys],
        width: actualWidth,
        height: this.nodeHeight,
        children: [] // will be populated if needed, but flat array is easier for React
      });

      if (d.parent) {
        layoutLinks.push({
          sourceId: `node_${d.parent.data.id}`,
          targetId: `node_${d.data.id}`,
          sourceX: d.parent.x,
          sourceY: d.parent.y + this.nodeHeight / 2, // bottom of parent
          targetX: d.x,
          targetY: d.y - this.nodeHeight / 2,        // top of child
        });
      }
    });

    return { nodes: layoutNodes, links: layoutLinks };
  }
}
