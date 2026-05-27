import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as d3 from 'd3';
import { LayerRegistry } from '../layer-registry';
import { Diff } from '../../engine/diff.types';
import { useSessionStore } from '../../store/session.store';
import { BPlusTree } from '../../engine/structures/bplus-tree';
import { BPlusRenderer, LayoutNode, LayoutLink } from './bplus-renderer';
import styles from './IndexLayer.module.css';

export const IndexLayer: React.FC = () => {
  const treeState = useSessionStore(s => s.currentTreeState) as BPlusTree | null;
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);
  const linksLayerRef = useRef<SVGGElement>(null);
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

  // Clear canvas if tree is null (e.g. session cleared)
  useEffect(() => {
    if (!treeState) {
      if (linksLayerRef.current) d3.select(linksLayerRef.current).selectAll('*').remove();
      if (nodesLayerRef.current) d3.select(nodesLayerRef.current).selectAll('*').remove();
    }
  }, [treeState]);

  useEffect(() => {
    LayerRegistry.register({
      id: 'index-layer',
      label: 'B+ Tree',
      component: IndexLayer,
      onDiff: (diff: Diff) => {
        const tl = gsap.timeline();
        

        // --- Highlights ---
        if (diff.type === 'NODE_HIGHLIGHT') {
          const el = nodesLayerRef.current?.querySelector(`#node_${diff.payload.nodeId}`);
          if (el) {
            tl.to(el.querySelector('rect'), {
              stroke: 'var(--accent)',
              duration: 0.2,
              yoyo: true,
              repeat: 1
            });
          }
        }
        
        if (diff.type === 'KEY_HIGHLIGHT') {
           const index = diff.payload.index as number;
           const el = nodesLayerRef.current?.querySelector(`#node_${diff.payload.nodeId}`);
           if (el) {
             const keyText = el.querySelectorAll('text')[index];
             if (keyText) {
                tl.to(keyText, {
                  fill: 'var(--accent)',
                  scale: 1.3,
                  duration: 0.3,
                  yoyo: true,
                  repeat: 1,
                  transformOrigin: '50% 50%'
                });
             }
           }
        }
        
        // --- Structural Changes via Snapshot ---
        if (diff.snapshot) {
           const renderer = new BPlusRenderer(diff.snapshot.capacity);
           const newLayout = renderer.computeLayout(diff.snapshot);
           
           const shiftX = window.innerWidth / 2;
           const shiftY = 100;
           newLayout.nodes.forEach(n => { n.x += shiftX; n.y += shiftY; });
           newLayout.links.forEach(l => { 
             l.sourceX += shiftX; l.sourceY += shiftY; 
             l.targetX += shiftX; l.targetY += shiftY; 
           });

           // 1. Links
           const linkSelection = d3.select(linksLayerRef.current)
             .selectAll<SVGPathElement, LayoutLink>('path')
             .data(newLayout.links, d => `${d.sourceId}-${d.targetId}`);

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

           // 2. Nodes
           const nodeSelection = d3.select(nodesLayerRef.current)
             .selectAll<SVGGElement, LayoutNode>('g.node-group')
             .data(newLayout.nodes, d => d.id);
             
           const nodeEnter = nodeSelection.enter().append('g')
             .attr('class', `node-group ${styles.nodeGroup}`)
             .attr('id', d => d.id)
             .style('opacity', 0);
             
           // Set initial position for new nodes to their target position but scaled down
           nodeEnter.each(function(d) {
             gsap.set(this, { x: d.x - d.width / 2, y: d.y - d.height / 2, scale: 0.5 });
           });

           const allNodesSel = nodeSelection.merge(nodeEnter);
           
           // Redraw inner contents
           allNodesSel.each(function(d) {
              const g = d3.select(this);
              g.selectAll('*').remove();
              g.append('rect')
               .attr('class', styles.nodeRect)
               .attr('width', d.width)
               .attr('height', d.height);
               
              const keyWidth = d.width / Math.max(1, d.keys.length);
              d.keys.forEach((key, idx) => {
                 const xPos = idx * keyWidth;
                 const keyGroup = g.append('g').attr('transform', `translate(${xPos}, 0)`);
                 keyGroup.append('rect')
                   .attr('class', styles.keyRect)
                   .attr('width', keyWidth)
                   .attr('height', d.height);
                 keyGroup.append('text')
                   .attr('class', styles.keyText)
                   .attr('x', keyWidth / 2)
                   .attr('y', d.height / 2)
                   .text(key);
              });
           });

           const allNodes = allNodesSel.nodes();
           if (allNodes.length > 0) {
             tl.to(allNodes, {
               x: (_, el) => { 
                 const d = d3.select(el).datum() as LayoutNode; 
                 return d.x - d.width / 2; 
               },
               y: (_, el) => { 
                 const d = d3.select(el).datum() as LayoutNode; 
                 return d.y - d.height / 2; 
               },
               scale: 1,
               opacity: 1,
               duration: 0.5,
               ease: 'power2.out'
             }, 0);
           }
           
           // Exit nodes
           const exitNodes = nodeSelection.exit().nodes();
           if (exitNodes.length > 0) {
               tl.to(exitNodes, {
                   scale: 0.5,
                   opacity: 0,
                   duration: 0.3,
                   onComplete: () => {
                       d3.selectAll(exitNodes).remove();
                   }
               }, 0);
           }
        }
        
        return tl;
      }
    });

    return () => {
      LayerRegistry.unregister('index-layer');
    };
  }, []);

  return (
    <svg ref={svgRef} className={styles.svgCanvas}>
      <defs>
        <filter id="glow-md" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g ref={zoomGroupRef}>
        <g ref={linksLayerRef} className="links" />
        <g ref={nodesLayerRef} className="nodes" />
      </g>
    </svg>
  );
};
