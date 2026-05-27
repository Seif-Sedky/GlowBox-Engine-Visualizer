import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import * as d3 from 'd3';
import { LayerRegistry } from '../layer-registry';
import { Diff } from '../../engine/diff.types';
import { useSessionStore } from '../../store/session.store';
import { RTree } from '../../engine/structures/r-tree';
import { RTreeRenderer, LayoutNode, LayoutLink, SpatialBox } from './rtree-renderer';
import styles from './RTreeLayer.module.css';

export const RTreeLayer: React.FC = () => {
  const treeState = useSessionStore(s => s.currentTreeState) as RTree | null;
  const treeSvgRef = useRef<SVGSVGElement>(null);
  const spatialSvgRef = useRef<SVGSVGElement>(null);
  
  const treeLinksRef = useRef<SVGGElement>(null);
  const treeNodesRef = useRef<SVGGElement>(null);
  const spatialBoxesRef = useRef<SVGGElement>(null);
  const treeZoomGroupRef = useRef<SVGGElement>(null);

  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!treeSvgRef.current || !treeZoomGroupRef.current) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        d3.select(treeZoomGroupRef.current).attr('transform', event.transform);
      });
    d3.select(treeSvgRef.current).call(zoom);
  }, []);

  useEffect(() => {
    if (spatialSvgRef.current) {
      const { width, height } = spatialSvgRef.current.getBoundingClientRect();
      setSvgDimensions({ width, height });
    }
    
    const handleResize = () => {
      if (spatialSvgRef.current) {
        const { width, height } = spatialSvgRef.current.getBoundingClientRect();
        setSvgDimensions({ width, height });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!treeState) {
      if (treeLinksRef.current) d3.select(treeLinksRef.current).selectAll('*').remove();
      if (treeNodesRef.current) d3.select(treeNodesRef.current).selectAll('*').remove();
      if (spatialBoxesRef.current) d3.select(spatialBoxesRef.current).selectAll('*').remove();
    }
  }, [treeState]);

  useEffect(() => {
    LayerRegistry.register({
      id: 'rtree-layer',
      label: 'R-Tree',
      component: RTreeLayer,
      onDiff: (diff: Diff) => {
        const tl = gsap.timeline();
        
        // Highlights for Tree View
        if (diff.type === 'NODE_HIGHLIGHT') {
          const el = treeNodesRef.current?.querySelector(`#node_${diff.payload.nodeId}`);
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
          const point = diff.payload.point as [number, number];
          const el = spatialBoxesRef.current?.querySelector(`#point_${point[0]}_${point[1]}`); // Approximated highlight by id
          if (el) {
             tl.to(el, {
               fill: 'var(--accent)',
               r: 8,
               duration: 0.3,
               yoyo: true,
               repeat: 1,
               transformOrigin: '50% 50%'
             });
          }
        }

        if (diff.snapshot) {
           const renderer = new RTreeRenderer(diff.snapshot.capacity);
           const newLayout = renderer.computeLayout(diff.snapshot);
           
           // Tree Layout Centering
           const shiftX = (treeSvgRef.current?.clientWidth || window.innerWidth / 2) / 2;
           const shiftY = 80;
           newLayout.nodes.forEach(n => { n.x += shiftX; n.y += shiftY; });
           newLayout.links.forEach(l => { 
             l.sourceX += shiftX; l.sourceY += shiftY; 
             l.targetX += shiftX; l.targetY += shiftY; 
           });

           // Tree Links
           const linkSelection = d3.select(treeLinksRef.current)
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

           // Tree Nodes
           const nodeSelection = d3.select(treeNodesRef.current)
             .selectAll<SVGGElement, LayoutNode>('g.node-group')
             .data(newLayout.nodes, d => d.id);
             
           const nodeEnter = nodeSelection.enter().append('g')
             .attr('class', `node-group ${styles.nodeGroup}`)
             .attr('id', d => d.id)
             .style('opacity', 0);
             
           nodeEnter.each(function(d) {
             gsap.set(this, { x: d.x - d.width / 2, y: d.y - d.height / 2, scale: 0.5 });
           });

           const allNodesSel = nodeSelection.merge(nodeEnter);
           allNodesSel.each(function(d) {
              const g = d3.select(this);
              g.selectAll('*').remove();
              g.append('rect')
               .attr('class', styles.nodeRect)
               .attr('width', d.width)
               .attr('height', d.height);
               
              const eWidth = d.width / Math.max(1, d.entries.length);
              d.entries.forEach((e, idx) => {
                 const xPos = idx * eWidth;
                 const eGroup = g.append('g').attr('transform', `translate(${xPos}, 0)`);
                 eGroup.append('rect')
                   .attr('class', styles.keyRect)
                   .attr('width', eWidth)
                   .attr('height', d.height);
                 
                 const text = e.point ? `(${e.point[0]},${e.point[1]})` : `MBR`;
                 eGroup.append('text')
                   .attr('class', styles.keyText)
                   .attr('x', eWidth / 2)
                   .attr('y', d.height / 2)
                   .attr('font-size', '10px')
                   .text(text);
              });
           });

           allNodesSel.on('click', (event, d) => {
             const boxId = d.id.replace('node_', 'box_');
             const box = d3.select(spatialBoxesRef.current).select(`#${boxId}`);
             if (!box.empty()) {
               const rect = box.select('rect');
               gsap.fromTo(rect.node(), 
                 { fill: 'rgba(255, 255, 255, 0.6)', strokeWidth: 5 },
                 { fill: 'rgba(0, 0, 0, 0.1)', strokeWidth: 2, duration: 1, ease: 'power2.out', clearProps: 'fill,strokeWidth' }
               );
               box.raise();
             }
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
           const exitNodes = nodeSelection.exit().nodes();
           if (exitNodes.length > 0) {
               tl.to(exitNodes, { scale: 0.5, opacity: 0, duration: 0.3, onComplete: () => d3.selectAll(exitNodes).remove() }, 0);
           }

           // --- Spatial View ---
           const rootMbr = diff.snapshot.root.mbr;
           let domainX = [0, 100];
           let domainY = [0, 100];
           
           if (rootMbr[0] !== Infinity && rootMbr[2] !== -Infinity) {
             const paddingX = Math.max(10, (rootMbr[2] - rootMbr[0]) * 0.1);
             const paddingY = Math.max(10, (rootMbr[3] - rootMbr[1]) * 0.1);
             domainX = [rootMbr[0] - paddingX, rootMbr[2] + paddingX];
             domainY = [rootMbr[1] - paddingY, rootMbr[3] + paddingY];
           }

           const w = svgDimensions.width || 600;
           const h = svgDimensions.height || 600;

           const xScale = d3.scaleLinear().domain(domainX).range([20, w - 20]);
           const yScale = d3.scaleLinear().domain(domainY).range([h - 20, 20]); // Invert Y for standard Cartesian

           const boxSelection = d3.select(spatialBoxesRef.current)
             .selectAll<SVGGElement, SpatialBox>('g.spatial-box')
             .data(newLayout.boxes, d => d.id);

           const boxEnter = boxSelection.enter().append('g')
             .attr('class', 'spatial-box')
             .attr('id', d => d.point ? `point_${d.point[0]}_${d.point[1]}` : d.id)
             .style('opacity', 0);
             
           const allBoxesSel = boxSelection.merge(boxEnter);
           allBoxesSel.each(function(d) {
             const g = d3.select(this);
             g.selectAll('*').remove();
             
             if (d.point) {
               g.append('circle')
                .attr('class', styles.spatialPoint)
                .attr('cx', xScale(d.point[0]))
                .attr('cy', yScale(d.point[1]))
                .attr('r', 5);
               g.append('text')
                .attr('class', styles.spatialLabel)
                .attr('x', xScale(d.point[0]) + 8)
                .attr('y', yScale(d.point[1]) - 8)
                .text(`${d.point[0]},${d.point[1]}`);
             } else {
               const minX = xScale(d.mbr[0]);
               const maxX = xScale(d.mbr[2]);
               const minY = yScale(d.mbr[3]); // flipped
               const maxY = yScale(d.mbr[1]); // flipped
               
               g.append('rect')
                .attr('class', styles.spatialBox)
                .attr('x', minX)
                .attr('y', minY)
                .attr('width', Math.max(1, maxX - minX))
                .attr('height', Math.max(1, maxY - minY))
                .attr('stroke', d.color);
             }
           });

           const allBoxes = allBoxesSel.nodes();
           if (allBoxes.length > 0) {
              tl.to(allBoxes, { opacity: 1, duration: 0.5 }, 0);
           }
           boxSelection.exit().transition().duration(300).style('opacity', 0).remove();
        }
        
        return tl;
      }
    });

    return () => {
      LayerRegistry.unregister('rtree-layer');
    };
  }, [svgDimensions]); // Re-register if dimensions change so scales update

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <svg ref={treeSvgRef} className={styles.svgCanvas}>
          <defs>
            <filter id="glow-md" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g ref={treeZoomGroupRef}>
            <g ref={treeLinksRef} className="links" />
            <g ref={treeNodesRef} className="nodes" />
          </g>
        </svg>
      </div>
      <div className={styles.panel}>
        <svg ref={spatialSvgRef} className={styles.svgCanvas}>
          <g ref={spatialBoxesRef} className="spatial-boxes" />
        </svg>
      </div>
    </div>
  );
};
