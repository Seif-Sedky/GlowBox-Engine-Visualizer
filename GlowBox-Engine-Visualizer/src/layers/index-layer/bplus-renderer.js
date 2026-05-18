import * as d3 from 'd3';
export class BPlusRenderer {
    constructor(capacity) {
        this.nodeWidth = 40; // width per key slot
        this.nodeHeight = 50;
        this.nodeGapX = 20;
        this.nodeGapY = 80;
        const maxNodeWidth = capacity * this.nodeWidth;
        this.treeLayout = d3.tree()
            .nodeSize([maxNodeWidth + this.nodeGapX, this.nodeHeight + this.nodeGapY]);
    }
    computeLayout(tree) {
        // 1. Create D3 hierarchy
        const rootHierarchy = d3.hierarchy(tree.root, node => node.children || []);
        // 2. Compute tree layout
        const treeData = this.treeLayout(rootHierarchy);
        // 3. Extract layout nodes
        const layoutNodes = [];
        const layoutLinks = [];
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
                    targetY: d.y - this.nodeHeight / 2, // top of child
                });
            }
        });
        return { nodes: layoutNodes, links: layoutLinks };
    }
}
//# sourceMappingURL=bplus-renderer.js.map