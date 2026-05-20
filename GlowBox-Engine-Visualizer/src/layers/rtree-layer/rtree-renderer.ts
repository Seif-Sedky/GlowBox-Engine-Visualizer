import * as d3 from 'd3';
import { RTree, RTreeNode, RTreeEntry, MBR } from '../../engine/structures/r-tree';

export interface LayoutNode {
  id: string;
  isLeaf: boolean;
  entries: RTreeEntry[];
  mbr: MBR;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutLink {
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface SpatialBox {
  id: string;
  mbr: MBR;
  color: string;
  depth: number;
  isLeaf: boolean;
  point?: [number, number];
}

export class RTreeRenderer {
  capacity: number;
  nodeWidth = 120;
  nodeHeight = 40;
  verticalSpacing = 80;
  horizontalSpacing = 20;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  computeLayout(tree: RTree): { nodes: LayoutNode[], links: LayoutLink[], boxes: SpatialBox[] } {
    const nodes: LayoutNode[] = [];
    const links: LayoutLink[] = [];
    const boxes: SpatialBox[] = [];

    // 1. Tree Layout
    const hierarchyData = d3.hierarchy<RTreeNode>(tree.root, d => d.isLeaf ? [] : d.entries.map(e => e.child!));
    
    // We'll use a standard tree layout for the left side
    const treeLayout = d3.tree<RTreeNode>()
      .nodeSize([this.nodeWidth + this.horizontalSpacing, this.verticalSpacing]);

    const rootNode = treeLayout(hierarchyData);

    rootNode.descendants().forEach(d => {
      const id = `node_${d.data.id}`;
      nodes.push({
        id,
        isLeaf: d.data.isLeaf,
        entries: d.data.entries,
        mbr: d.data.mbr,
        x: d.x,
        y: d.y,
        width: this.nodeWidth,
        height: this.nodeHeight
      });
    });

    rootNode.links().forEach(l => {
      links.push({
        sourceId: `node_${l.source.data.id}`,
        targetId: `node_${l.target.data.id}`,
        sourceX: l.source.x,
        sourceY: l.source.y + this.nodeHeight / 2,
        targetX: l.target.x,
        targetY: l.target.y - this.nodeHeight / 2
      });
    });

    // 2. Spatial Boxes Layout
    // Traverse the tree to generate boxes
    const colors = ['var(--accent)', '#a855f7', '#3b82f6', '#10b981']; // Depth colors
    
    const traverseBoxes = (node: RTreeNode, depth: number) => {
      const color = colors[depth % colors.length];
      
      // Node's MBR
      if (node.id !== tree.root.id || node.entries.length > 0) {
        boxes.push({
            id: `box_${node.id}`,
            mbr: node.mbr,
            color: color,
            depth: depth,
            isLeaf: node.isLeaf
        });
      }

      if (node.isLeaf) {
        // Leaf points
        node.entries.forEach((e, idx) => {
          if (e.point) {
            boxes.push({
              id: `point_${node.id}_${idx}`,
              mbr: e.mbr,
              color: 'var(--text-primary)',
              depth: depth + 1,
              isLeaf: true,
              point: e.point
            });
          }
        });
      } else {
        node.entries.forEach(e => {
          if (e.child) traverseBoxes(e.child, depth + 1);
        });
      }
    };

    traverseBoxes(tree.root, 0);

    return { nodes, links, boxes };
  }
}
