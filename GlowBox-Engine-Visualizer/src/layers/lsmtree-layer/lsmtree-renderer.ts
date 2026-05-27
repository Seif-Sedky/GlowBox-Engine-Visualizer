import { LSMTree, AVLTreeNode } from '../../engine/structures/lsm-tree';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  key: number;
  isTombstone: boolean;
  type: 'memtable' | 'sstable_entry';
}

export interface LayoutLink {
  id: string;
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface LayoutSSTable {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export interface LSMLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
  sstables: LayoutSSTable[];
}

export class LSMTreeRenderer {
  NODE_RADIUS = 20;
  CELL_W = 40;
  CELL_H = 30;
  
  MEMTABLE_START_Y = 100;
  DISK_START_Y = 400;
  LEVEL_SPACING = 100;
  SSTABLE_SPACING = 30;

  computeLayout(tree: LSMTree): LSMLayout {
    const layout: LSMLayout = { nodes: [], links: [], sstables: [] };

    // 1. Layout MemTable (AVL Tree)
    if (tree.memTableRoot) {
      let inOrderIndex = 0;
      const xSpacing = 60;
      const ySpacing = 60;

      const traverse = (node: AVLTreeNode, depth: number) => {
        if (node.left) {
          traverse(node.left, depth + 1);
          layout.links.push({
            id: `link-${node.id}-${node.left.id}`,
            sourceId: node.id,
            targetId: node.left.id,
            sourceX: 0, sourceY: 0, targetX: 0, targetY: 0 // Will compute after X/Y are known
          });
        }

        const nodeX = inOrderIndex * xSpacing;
        const nodeY = this.MEMTABLE_START_Y + depth * ySpacing;
        
        layout.nodes.push({
          id: node.id,
          x: nodeX,
          y: nodeY,
          width: this.NODE_RADIUS * 2,
          height: this.NODE_RADIUS * 2,
          key: node.key,
          isTombstone: node.isTombstone,
          type: 'memtable'
        });
        
        inOrderIndex++;

        if (node.right) {
          traverse(node.right, depth + 1);
          layout.links.push({
            id: `link-${node.id}-${node.right.id}`,
            sourceId: node.id,
            targetId: node.right.id,
            sourceX: 0, sourceY: 0, targetX: 0, targetY: 0
          });
        }
      };

      traverse(tree.memTableRoot, 0);

      // Center the AVL tree horizontally
      const totalWidth = inOrderIndex * xSpacing;
      const offset = -totalWidth / 2;
      layout.nodes.filter(n => n.type === 'memtable').forEach(n => n.x += offset);

      // Resolve link coords
      layout.links.forEach(l => {
        const source = layout.nodes.find(n => n.id === l.sourceId)!;
        const target = layout.nodes.find(n => n.id === l.targetId)!;
        l.sourceX = source.x;
        l.sourceY = source.y + this.NODE_RADIUS;
        l.targetX = target.x;
        l.targetY = target.y - this.NODE_RADIUS;
      });
    }

    // 2. Layout Disk Levels
    let currentY = this.DISK_START_Y;
    
    for (let l = 0; l < tree.levels.length; l++) {
      const level = tree.levels[l];
      if (level.length === 0) continue;

      let currentX = 0;
      
      // Calculate total width of this level to center it
      let levelWidth = 0;
      level.forEach(sst => {
        levelWidth += sst.entries.length * this.CELL_W + this.SSTABLE_SPACING;
      });
      levelWidth -= this.SSTABLE_SPACING; // remove last spacing
      currentX = -levelWidth / 2;

      level.forEach(sst => {
        const sstWidth = sst.entries.length * this.CELL_W;
        
        layout.sstables.push({
          id: sst.id,
          x: currentX,
          y: currentY,
          width: sstWidth,
          height: this.CELL_H,
          level: l
        });

        sst.entries.forEach((entry, idx) => {
          layout.nodes.push({
            id: `entry-${sst.id}-${idx}`,
            x: currentX + idx * this.CELL_W + this.CELL_W / 2, // center of cell
            y: currentY + this.CELL_H / 2,
            width: this.CELL_W,
            height: this.CELL_H,
            key: entry.key,
            isTombstone: entry.isTombstone,
            type: 'sstable_entry'
          });
        });

        currentX += sstWidth + this.SSTABLE_SPACING;
      });

      currentY += this.LEVEL_SPACING;
    }

    return layout;
  }
}
