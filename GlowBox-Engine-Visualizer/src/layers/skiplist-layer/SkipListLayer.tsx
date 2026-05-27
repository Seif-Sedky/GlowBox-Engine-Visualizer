import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import * as d3 from 'd3';
import { LayerRegistry } from '../layer-registry';
import { Diff } from '../../engine/diff.types';
import { useSessionStore } from '../../store/session.store';
import { useUIStore } from '../../store/ui.store';
import { THEMES } from '../../store/theme.types';
import { SkipList } from '../../engine/structures/skip-list';
import { SkipListRenderer, LayoutNode, LayoutLink } from './skiplist-renderer';
import styles from '../index-layer/IndexLayer.module.css';
import coinStyles from './SkipListLayer.module.css';

export const SkipListLayer: React.FC = () => {
  const treeState = useSessionStore(s => s.currentTreeState) as SkipList | null;
  const { theme } = useUIStore();
  const activeTheme = THEMES[theme];
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);
  const linksLayerRef = useRef<SVGGElement>(null);
  const nodesLayerRef = useRef<SVGGElement>(null);

  const activePathRef = useRef<Array<{nodeId: string, level: number}>>([]);
  
  const [coinFlip, setCoinFlip] = useState<{ active: boolean, success: boolean, level: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !zoomGroupRef.current) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        d3.select(zoomGroupRef.current).attr('transform', event.transform);
      });
    d3.select(svgRef.current).call(zoom);
    
    // Create arrowheads
    const svg = d3.select(svgRef.current);
    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    const createMarker = (id: string, color: string) => {
      let marker = defs.select(`#${id}`);
      if (marker.empty()) {
        marker = defs.append('marker')
          .attr('id', id)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 8)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto');
        marker.append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', color);
      } else {
        marker.select('path').attr('fill', color);
      }
    };
    createMarker('arrowhead-normal', 'var(--glass-border)');
    createMarker('arrowhead-active', activeTheme.accent);

  }, [activeTheme.accent]);

  useEffect(() => {
    if (!treeState) {
      if (linksLayerRef.current) d3.select(linksLayerRef.current).selectAll('*').remove();
      if (nodesLayerRef.current) d3.select(nodesLayerRef.current).selectAll('*').remove();
      activePathRef.current = [];
    }
  }, [treeState]);

  useEffect(() => {
    LayerRegistry.register({
      id: 'skiplist-layer',
      label: 'Skip List',
      component: SkipListLayer,
      onDiff: (diff: Diff) => {
        const tl = gsap.timeline();

        // Path highlighting logic
        if (diff.type === 'ANNOTATION') {
          if (diff.annotation?.startsWith('Searching') || diff.annotation?.startsWith('Inserting') || diff.annotation?.startsWith('Deleting')) {
             activePathRef.current = []; // Clear path on new operation
          }
        }
        
        if (diff.type === 'SL_NODE_HIGHLIGHT') {
           activePathRef.current.push({ nodeId: diff.payload.nodeId, level: diff.payload.level });
        }

        // Coin Flip animation
        if (diff.type === 'SL_COIN_FLIP') {
           tl.call(() => {
             setCoinFlip({ active: true, success: diff.payload.success, level: diff.payload.level || 0 });
           });
           tl.to({}, { duration: 0.8 }); // Wait for flip animation
           tl.call(() => setCoinFlip(null));
        }

        if (diff.snapshot) {
           const renderer = new SkipListRenderer();
           const newLayout = renderer.computeLayout(diff.snapshot);
           
           const shiftX = 40;
           const shiftY = (containerRef.current?.clientHeight || 600) / 2 + 50;

           // Apply Shifts
           newLayout.nodes.forEach(n => { n.x += shiftX; n.y += shiftY; });
           newLayout.links.forEach(l => { 
             l.sourceX += shiftX; l.sourceY += shiftY; 
             l.targetX += shiftX; l.targetY += shiftY; 
           });

           // 1. Links
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
               attr: { 
                 d: (_, el) => { 
                    const d = d3.select(el).datum() as LayoutLink;
                    return `M ${d.sourceX} ${d.sourceY} L ${d.targetX} ${d.targetY}`;
                 } 
               },
               opacity: 1,
               duration: 0.5,
               ease: 'power2.out'
             }, 0);
           }
           linkSelection.exit().transition().duration(300).style('opacity', 0).remove();

           // 2. Nodes (Columns)
           const nodeSelection = d3.select(nodesLayerRef.current)
             .selectAll<SVGGElement, LayoutNode>('g.node-group')
             .data(newLayout.nodes, d => d.id);
             
           const nodeEnter = nodeSelection.enter().append('g')
             .attr('class', `node-group ${styles.nodeGroup}`)
             .attr('id', d => d.id)
             .style('opacity', 0);
             
           nodeEnter.each(function(d) {
             gsap.set(this, { x: d.x, y: d.y, scale: 0.5 });
           });

           const allNodesSel = nodeSelection.merge(nodeEnter);
           
           allNodesSel.each(function(d) {
              const g = d3.select(this);
              g.selectAll('*').remove();
              
              d.cells.forEach(cell => {
                const isPath = activePathRef.current.some(p => p.nodeId === d.id && p.level === cell.level);
                
                const cellG = g.append('g').attr('transform', `translate(0, ${cell.y})`);
                
                cellG.append('rect')
                  .attr('id', `rect-${d.id}-${cell.level}`)
                  .attr('width', renderer.CELL_W)
                  .attr('height', renderer.CELL_H)
                  .attr('fill', isPath ? activeTheme.accent : 'var(--bg-elevated)')
                  .attr('stroke', isPath ? '#fff' : 'var(--glass-border)')
                  .attr('stroke-width', 1)
                  .style('transition', 'fill 0.3s ease');
                  
                const textVal = d.isHead ? 'HEAD' : d.value.toString();
                cellG.append('text')
                  .attr('id', `text-${d.id}-${cell.level}`)
                  .attr('x', renderer.CELL_W / 2)
                  .attr('y', renderer.CELL_H / 2)
                  .attr('text-anchor', 'middle')
                  .attr('dominant-baseline', 'central')
                  .attr('fill', isPath ? 'var(--bg-elevated)' : 'var(--text-primary)')
                  .attr('font-size', '12px')
                  .attr('font-family', 'var(--font-mono)')
                  .text(textVal);
              });
           });

           // Update link styles based on path
           d3.select(linksLayerRef.current).selectAll<SVGPathElement, LayoutLink>('path')
             .each(function(d) {
               const isPath = activePathRef.current.some(p => p.nodeId === d.sourceId && p.level === d.level);
               d3.select(this)
                 .attr('stroke', isPath ? activeTheme.accent : 'var(--glass-border)')
                 .attr('stroke-width', isPath ? 3 : 2)
                 .attr('marker-end', `url(#arrowhead-${isPath ? 'active' : 'normal'})`)
                 .style('filter', isPath ? `drop-shadow(0 0 8px ${activeTheme.accent})` : 'none');
             });

           const allNodes = allNodesSel.nodes();
           if (allNodes.length > 0) {
             tl.to(allNodes, {
               x: (_, el) => (d3.select(el).datum() as LayoutNode).x,
               y: (_, el) => (d3.select(el).datum() as LayoutNode).y,
               scale: 1,
               opacity: 1,
               duration: 0.5,
               ease: 'power2.out'
             }, 0);
           }
           
           const exitNodes = nodeSelection.exit().nodes();
           if (exitNodes.length > 0) {
               tl.to(exitNodes, {
                   scale: 0.5,
                   opacity: 0,
                   duration: 0.3,
                   onComplete: () => d3.selectAll(exitNodes).remove()
               }, 0);
           }
        } else if (diff.type === 'SL_NODE_HIGHLIGHT') {
            const { nodeId, level } = diff.payload;
            const rect = d3.select(nodesLayerRef.current).select(`#rect-${nodeId}-${level}`);
            const text = d3.select(nodesLayerRef.current).select(`#text-${nodeId}-${level}`);
            
            if (!rect.empty()) {
                tl.to(rect.node(), { fill: activeTheme.accent, duration: 0.2 }, 0);
            }
            if (!text.empty()) {
                tl.to(text.node(), { fill: 'var(--bg-elevated)', duration: 0.2 }, 0);
            }
              
            d3.select(linksLayerRef.current).selectAll<SVGPathElement, LayoutLink>('path')
              .each(function(d) {
                const isPath = activePathRef.current.some(p => p.nodeId === d.sourceId && p.level === d.level);
                d3.select(this)
                 .attr('stroke', isPath ? activeTheme.accent : 'var(--glass-border)')
                 .attr('stroke-width', isPath ? 3 : 2)
                 .attr('marker-end', `url(#arrowhead-${isPath ? 'active' : 'normal'})`)
                 .style('filter', isPath ? `drop-shadow(0 0 8px ${activeTheme.accent})` : 'none');
              });
              
            tl.to({}, { duration: 0.3 }); // Small pause for highlight
        } else if (diff.type === 'SL_CLEAR_HIGHLIGHT') {
            tl.to({}, { duration: 2 }); // Wait 2 seconds
            tl.call(() => {
                activePathRef.current = []; // Clear the path
            });
            // Animate all back to normal
            const renderer = new SkipListRenderer();
            d3.select(nodesLayerRef.current).selectAll<SVGGElement, LayoutNode>('g.node-group')
              .each(function(d) {
                const g = d3.select(this);
                d.cells.forEach(cell => {
                   const rect = g.select(`#rect-${d.id}-${cell.level}`);
                   const text = g.select(`#text-${d.id}-${cell.level}`);
                   if (!rect.empty()) tl.to(rect.node(), { fill: 'var(--bg-elevated)', duration: 0.5 }, tl.time());
                   if (!text.empty()) tl.to(text.node(), { fill: 'var(--text-primary)', duration: 0.5 }, tl.time());
                });
              });
              
            d3.select(linksLayerRef.current).selectAll<SVGPathElement, LayoutLink>('path')
              .each(function(d) {
                d3.select(this)
                 .attr('stroke', 'var(--glass-border)')
                 .attr('stroke-width', 2)
                 .attr('marker-end', 'url(#arrowhead-normal)')
                 .style('filter', 'none');
              });
        }

        return tl;
      }
    });

    return () => {
      LayerRegistry.unregister('skiplist-layer');
    };
  }, [activeTheme]);

  return (
    <div className={styles.layerContainer} ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} className={styles.svgCanvas}>
        <g ref={zoomGroupRef}>
          <g ref={linksLayerRef} className="links" />
          <g ref={nodesLayerRef} className="nodes" />
        </g>
      </svg>
      
      {/* Coin Overlay */}
      {coinFlip && (
        <div className={coinStyles.coinContainer}>
           <div className={`${coinStyles.coin} ${coinFlip.success ? coinStyles.heads : coinStyles.tails}`}
                style={{ '--coin-accent': activeTheme.accent } as any}>
             <div className={coinStyles.coinFront}>H</div>
             <div className={coinStyles.coinBack}>T</div>
           </div>
           <div className={coinStyles.coinLabel}>
             {coinFlip.success ? 'Heads! Level Up ↑' : 'Tails. Stop.'}
           </div>
        </div>
      )}
    </div>
  );
};
