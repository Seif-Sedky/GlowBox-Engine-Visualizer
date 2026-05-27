import * as d3 from 'd3';
import { InvertedIndex, FSTNode } from '../../engine/structures/inverted-index';
import { ThemeDefinition } from '../../store/theme.types';

interface RenderContext {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  theme: ThemeDefinition;
}

// Convert FST to a hierarchical D3 structure
function buildD3Hierarchy(rootNode: FSTNode) {
  const build = (node: FSTNode): any => {
    const children = Object.values(node.children).map(build);
    return {
      name: node.id,
      char: node.char,
      isFinal: node.isFinal,
      termId: node.termId,
      children: children.length > 0 ? children : undefined,
    };
  };
  return build(rootNode);
}

export function renderInvertedIndex(ctx: RenderContext, tree: InvertedIndex, active: { activeNodeId: string | null, activeTermId: number | null }) {
  const { svg, width, height, theme } = ctx;
  svg.selectAll('*').remove();

  // Three column layout
  const colWidth = width / 3;

  // 1. Render Documents (Left Column)
  const docGroup = svg.append('g').attr('transform', `translate(20, 20)`);
  docGroup.append('text')
    .attr('fill', 'var(--text-primary)')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr('font-family', 'var(--font-display)')
    .text('Documents');

  tree.documents.forEach((doc, i) => {
    const y = 40 + i * 40;
    const g = docGroup.append('g').attr('transform', `translate(0, ${y})`);
    
    g.append('rect')
      .attr('width', colWidth - 40)
      .attr('height', 30)
      .attr('rx', 4)
      .attr('fill', 'var(--bg-elevated)')
      .attr('stroke', 'var(--glass-border)');

    g.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', 'var(--text-primary)')
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .text(`Doc ${doc.id}: ${doc.text.length > 30 ? doc.text.substring(0, 27) + '...' : doc.text}`);
  });

  // 2. Render Postings (Right Column)
  const postingGroup = svg.append('g').attr('transform', `translate(${colWidth * 2 + 20}, 20)`);
  postingGroup.append('text')
    .attr('fill', 'var(--text-primary)')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr('font-family', 'var(--font-display)')
    .text('Postings List');

  let pIndex = 0;
  for (const termIdStr in tree.postings) {
    const termId = parseInt(termIdStr, 10);
    const docs = tree.postings[termId];
    // Find the word for this termId from the FST by traversing
    // (For visualization, we could just pass a mapping of termId -> word, but let's just show Term ID)
    const y = 40 + pIndex * 40;
    const g = postingGroup.append('g').attr('transform', `translate(0, ${y})`);

    const isActiveTerm = active.activeTermId === termId;

    g.append('rect')
      .attr('width', 60)
      .attr('height', 30)
      .attr('rx', 4)
      .attr('fill', isActiveTerm ? theme.accent : 'var(--bg-elevated)')
      .attr('stroke', isActiveTerm ? theme.accent : 'var(--glass-border)')
      .style('filter', isActiveTerm ? `drop-shadow(0 0 10px ${theme.accent})` : 'none');

    g.append('text')
      .attr('x', 30)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', isActiveTerm ? 'var(--bg-elevated)' : 'var(--text-primary)')
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-weight', 'bold')
      .text(`T${termId}`);

    g.append('text')
      .attr('x', 70)
      .attr('y', 20)
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '14px')
      .text('→');

    docs.forEach((dId, di) => {
      const dg = g.append('g').attr('transform', `translate(${95 + di * 40}, 0)`);
      dg.append('rect')
        .attr('width', 30)
        .attr('height', 30)
        .attr('rx', 4)
        .attr('fill', 'var(--bg-elevated)')
        .attr('stroke', 'var(--glass-border)');
      
      dg.append('text')
        .attr('x', 15)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', '12px')
        .attr('font-family', 'var(--font-mono)')
        .text(`D${dId}`);
    });
    pIndex++;
  }

  // 3. Render FST / Trie (Center Column)
  const fstGroup = svg.append('g').attr('transform', `translate(${colWidth}, 60)`);
  
  fstGroup.append('text')
    .attr('x', colWidth / 2)
    .attr('y', -40)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-primary)')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .attr('font-family', 'var(--font-display)')
    .text('FST Dictionary');

  // D3 Tree Layout
  const rootData = buildD3Hierarchy(tree.fstRoot);
  const hierarchyRoot = d3.hierarchy(rootData);
  const treeLayout = d3.tree<any>().size([colWidth - 40, height - 120]);
  treeLayout(hierarchyRoot);

  // Edges (Transitions)
  fstGroup.selectAll('.link')
    .data(hierarchyRoot.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', 'var(--glass-border)')
    .attr('stroke-width', 2)
    .attr('d', d3.linkVertical<any, any>()
      .x(d => d.x)
      .y(d => d.y)
    );

  // Edge labels (Characters)
  fstGroup.selectAll('.link-label')
    .data(hierarchyRoot.links())
    .enter()
    .append('text')
    .attr('class', 'link-label')
    .attr('x', d => (d.source.x + d.target.x) / 2 + 10)
    .attr('y', d => (d.source.y + d.target.y) / 2)
    .attr('fill', 'var(--text-secondary)')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .attr('font-family', 'var(--font-mono)')
    .text(d => d.target.data.char);

  // Nodes
  const nodes = fstGroup.selectAll('.node')
    .data(hierarchyRoot.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x}, ${d.y})`);

  nodes.append('circle')
    .attr('r', 15)
    .attr('fill', d => {
      if (d.data.name === active.activeNodeId) return theme.accent;
      if (d.data.isFinal) return 'var(--text-secondary)';
      return 'var(--bg-elevated)';
    })
    .attr('stroke', d => d.data.name === active.activeNodeId ? '#fff' : theme.accent)
    .attr('stroke-width', 2)
    .style('filter', d => {
      if (d.data.name === active.activeNodeId) return `drop-shadow(0 0 10px ${theme.accent})`;
      if (d.data.isFinal) return `drop-shadow(0 0 8px var(--text-secondary))`;
      return 'none';
    });

  // Term ID output (if final)
  nodes.filter(d => d.data.isFinal)
    .append('text')
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-secondary)')
    .style('filter', 'drop-shadow(0 0 5px var(--text-secondary))')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('font-family', 'var(--font-mono)')
    .text(d => `T${d.data.termId}`);
}
