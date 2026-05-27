import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as d3 from 'd3';
import { LayerRegistry } from '../layer-registry';
import { Diff } from '../../engine/diff.types';
import { useSessionStore } from '../../store/session.store';
import { useUIStore } from '../../store/ui.store';
import { THEMES } from '../../store/theme.types';
import { LSMTree } from '../../engine/structures/lsm-tree';
import { LSMTreeRenderer, LayoutNode, LayoutLink, LayoutSSTable } from './lsmtree-renderer';
import styles from './LsmTreeLayer.module.css';

export const LsmTreeLayer: React.FC = () => {
  const treeState = useSessionStore(s => s.currentTreeState) as LSMTree | null;
  const { theme } = useUIStore();
  const activeTheme = THEMES[theme];
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);
  
  const linksLayerRef = useRef<SVGGElement>(null);
  const sstablesLayerRef = useRef<SVGGElement>(null);
  const nodesLayerRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !zoomGroupRef.current) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        d3.select(zoomGroupRef.current).attr('transform', event.transform);
      });
    d3.select(svgRef.current).call(zoom);
  }, []);

  useEffect(() => {
    if (!treeState) {
      if (linksLayerRef.current) d3.select(linksLayerRef.current).selectAll('*').remove();
      if (sstablesLayerRef.current) d3.select(sstablesLayerRef.current).selectAll('*').remove();
      if (nodesLayerRef.current) d3.select(nodesLayerRef.current).selectAll('*').remove();
    }
  }, [treeState]);

  useEffect(() => {
    LayerRegistry.register({
      id: 'lsmtree-layer',
      label: 'LSM Tree',
      component: LsmTreeLayer,
      onDiff: (diff: Diff) => {
        const tl = gsap.timeline();

        // Highlighting Logic
        if (diff.type === 'LSM_SEARCH_HIGHLIGHT') {
            const { id, sstId, entryIndex } = diff.payload;
            if (id) {
               // Memtable or SSTable highlight
               const targetId = id.startsWith('avl_') ? `#node-${id}` : `#sstable-${id}`;
               const el = zoomGroupRef.current?.querySelector(targetId);
               if (el) {
                  tl.to(el.querySelector('rect') || el.querySelector('circle'), {
                      stroke: activeTheme.accent,
                      strokeWidth: 3,
                      duration: 0.2
                  }, 0);
               }
            } else if (sstId && entryIndex !== undefined) {
               // Specific entry highlight
               const el = nodesLayerRef.current?.querySelector(`#node-entry-${sstId}-${entryIndex}`);
               if (el) {
                  tl.to(el.querySelector('rect'), {
                      fill: activeTheme.accent,
                      duration: 0.2
                  }, 0);
                  tl.to(el.querySelector('text'), {
                      fill: 'var(--bg-elevated)',
                      duration: 0.2
                  }, 0);
               }
            }
            tl.to({}, { duration: 0.3 }); // Pause
        } else if (diff.type === 'LSM_CLEAR_HIGHLIGHT') {
            tl.to({}, { duration: 1.5 });
            
            // Revert all colors
            tl.call(() => {
                d3.select(nodesLayerRef.current).selectAll<SVGGElement, LayoutNode>('g.node-group')
                  .each(function(d) {
                    const g = d3.select(this);
                    if (d.type === 'memtable') {
                       g.select('circle').attr('stroke', d.isTombstone ? 'rgba(220, 53, 69, 0.5)' : activeTheme.accent).attr('stroke-width', 2);
                    } else {
                       g.select('rect').attr('fill', d.isTombstone ? 'rgba(220, 53, 69, 0.1)' : 'var(--bg-elevated)');
                       g.select('text').attr('fill', d.isTombstone ? '#dc3545' : 'var(--text-primary)');
                    }
                  });
                d3.select(sstablesLayerRef.current).selectAll('g').select('rect')
                  .attr('stroke', 'var(--glass-border)')
                  .attr('stroke-width', 1);
            });
        }

        // Structural Rendering
        if (diff.snapshot) {
           const renderer = new LSMTreeRenderer();
           const newLayout = renderer.computeLayout(diff.snapshot);
           
           const shiftX = (containerRef.current?.clientWidth || 800) / 2;
           const shiftY = 50;

           // Apply Shifts
           newLayout.nodes.forEach(n => { n.x += shiftX; n.y += shiftY; });
           newLayout.links.forEach(l => { 
             l.sourceX += shiftX; l.sourceY += shiftY; 
             l.targetX += shiftX; l.targetY += shiftY; 
           });
           newLayout.sstables.forEach(s => { s.x += shiftX; s.y += shiftY; });

           // 1. Links (AVL)
           const linkSelection = d3.select(linksLayerRef.current)
             .selectAll<SVGPathElement, LayoutLink>('path')
             .data(newLayout.links, d => d.id);

           const linksEnter = linkSelection.enter().append('path')
             .attr('class', styles.linkPath)
             .attr('d', d => `M ${d.sourceX} ${d.sourceY} L ${d.sourceX} ${d.sourceY}`)
             .style('opacity', 0);
             
           const allLinks = linkSelection.merge(linksEnter).nodes();
           if (allLinks.length > 0) {
             tl.to(allLinks, {
               attr: { d: (_, el) => { 
                    const d = d3.select(el).datum() as LayoutLink;
                    return `M ${d.sourceX} ${d.sourceY} L ${d.targetX} ${d.targetY}`;
               }},
               opacity: 1,
               duration: 0.5,
               ease: 'power2.out'
             }, 0);
           }
           linkSelection.exit().transition().duration(300).style('opacity', 0).remove();

           // 2. SSTables (Background containers)
           const sstSelection = d3.select(sstablesLayerRef.current)
             .selectAll<SVGGElement, LayoutSSTable>('g')
             .data(newLayout.sstables, d => d.id);
             
           const sstEnter = sstSelection.enter().append('g')
             .attr('id', d => `sstable-${d.id}`)
             .attr('class', styles.sstableGroup)
             .style('opacity', 0);
             
           sstEnter.each(function(d) {
             gsap.set(this, { x: d.x, y: d.y, scale: 0.8 });
             
             const g = d3.select(this);
             g.append('rect')
              .attr('width', d.width)
              .attr('height', d.height)
              .attr('rx', 4);
              
             g.append('text')
              .attr('class', styles.levelLabel)
              .attr('x', 5)
              .attr('y', -5)
              .text(`L${d.level}`);
           });
           
           const allSSTables = sstSelection.merge(sstEnter).nodes();
           if (allSSTables.length > 0) {
             tl.to(allSSTables, {
               x: (_, el) => (d3.select(el).datum() as LayoutSSTable).x,
               y: (_, el) => (d3.select(el).datum() as LayoutSSTable).y,
               scale: 1,
               opacity: 1,
               duration: 0.6,
               ease: 'back.out(1.2)'
             }, 0);
           }
           sstSelection.exit().transition().duration(400).style('opacity', 0).remove();

           // 3. Nodes (AVL nodes + SSTable entries)
           const nodeSelection = d3.select(nodesLayerRef.current)
             .selectAll<SVGGElement, LayoutNode>('g.node-group')
             .data(newLayout.nodes, d => d.id);
             
           const nodeEnter = nodeSelection.enter().append('g')
             .attr('class', d => `node-group ${d.type === 'memtable' ? styles.memtableNode : styles.sstableEntry} ${d.isTombstone ? styles.tombstoneNode : ''}`)
             .attr('id', d => `node-${d.id}`)
             .style('opacity', 0);
             
           nodeEnter.each(function(d) {
             gsap.set(this, { x: d.x, y: d.y - 50, scale: 0.5 }); // Start slightly above
             
             const g = d3.select(this);
             const displayKey = d.isTombstone ? `${d.key} (X)` : `${d.key}`;
             
             if (d.type === 'memtable') {
                g.append('circle')
                 .attr('r', renderer.NODE_RADIUS)
                 .attr('fill', 'var(--bg-elevated)')
                 .attr('stroke', d.isTombstone ? 'rgba(220, 53, 69, 0.5)' : activeTheme.accent)
                 .attr('stroke-width', 2);
                g.append('text')
                 .attr('text-anchor', 'middle')
                 .attr('dominant-baseline', 'central')
                 .attr('fill', d.isTombstone ? '#dc3545' : 'var(--text-primary)')
                 .text(displayKey);
             } else {
                g.append('rect')
                 .attr('x', -renderer.CELL_W / 2)
                 .attr('y', -renderer.CELL_H / 2)
                 .attr('width', renderer.CELL_W)
                 .attr('height', renderer.CELL_H)
                 .attr('fill', d.isTombstone ? 'rgba(220, 53, 69, 0.1)' : 'var(--bg-elevated)')
                 .attr('stroke', 'var(--glass-border)')
                 .attr('stroke-width', 1);
                g.append('text')
                 .attr('text-anchor', 'middle')
                 .attr('dominant-baseline', 'central')
                 .attr('fill', d.isTombstone ? '#dc3545' : 'var(--text-primary)')
                 .text(displayKey);
             }
           });
           
           const allNodes = nodeSelection.merge(nodeEnter).nodes();
           if (allNodes.length > 0) {
             tl.to(allNodes, {
               x: (_, el) => (d3.select(el).datum() as LayoutNode).x,
               y: (_, el) => (d3.select(el).datum() as LayoutNode).y,
               scale: 1,
               opacity: 1,
               duration: 0.6,
               ease: 'back.out(1.2)'
             }, 0);
           }
           
           const exitNodes = nodeSelection.exit().nodes();
           if (exitNodes.length > 0) {
               tl.to(exitNodes, {
                   y: '+=50', // Fall down
                   scale: 0.5,
                   opacity: 0,
                   duration: 0.4,
                   onComplete: () => d3.selectAll(exitNodes).remove()
               }, 0);
           }
        }

        return tl;
      }
    });

    return () => {
      LayerRegistry.unregister('lsmtree-layer');
    };
  }, [activeTheme]);

  return (
    <div className={styles.layerContainer} ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} className={styles.svgCanvas}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g ref={zoomGroupRef}>
          {/* Background area for MemTable */}
          <rect x="-10000" y="50" width="20000" height="350" fill="var(--glass-bg)" opacity="0.5" />
          <text x="50" y="80" fill="var(--text-secondary)" fontFamily="var(--font-mono)" fontSize="16px" opacity="0.7">RAM (MemTable)</text>
          
          <rect x="-10000" y="400" width="20000" height="10000" fill="rgba(0,0,0,0.2)" />
          <text x="50" y="430" fill="var(--text-secondary)" fontFamily="var(--font-mono)" fontSize="16px" opacity="0.7">DISK (SSTables)</text>

          <g ref={sstablesLayerRef} className="sstables" />
          <g ref={linksLayerRef} className="links" />
          <g ref={nodesLayerRef} className="nodes" />
        </g>
      </svg>
    </div>
  );
};
