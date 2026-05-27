import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as d3 from 'd3';
import { LayerRegistry } from '../layer-registry';
import { Diff } from '../../engine/diff.types';
import { useSessionStore } from '../../store/session.store';
import { ExtendibleHash } from '../../engine/structures/extendible-hash';
import { HashRenderer, LayoutDirectoryCell, LayoutBucket, LayoutHashLink } from './hash-renderer';
import styles from '../index-layer/IndexLayer.module.css'; // Reusing styles from IndexLayer

export const HashLayer: React.FC = () => {
  const treeState = useSessionStore(s => s.currentTreeState) as ExtendibleHash | null;
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);
  const linksLayerRef = useRef<SVGGElement>(null);
  const dirLayerRef = useRef<SVGGElement>(null);
  const bucketsLayerRef = useRef<SVGGElement>(null);

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
      if (dirLayerRef.current) d3.select(dirLayerRef.current).selectAll('*').remove();
      if (bucketsLayerRef.current) d3.select(bucketsLayerRef.current).selectAll('*').remove();
    }
  }, [treeState]);

  useEffect(() => {
    LayerRegistry.register({
      id: 'hash-layer',
      label: 'Extendible Hash',
      component: HashLayer,
      onDiff: (diff: Diff) => {
        const tl = gsap.timeline();

        // --- Highlights ---
        if (diff.type === 'NODE_HIGHLIGHT') {
          const el = bucketsLayerRef.current?.querySelector(`#bucket_${diff.payload.nodeId}`);
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
           const el = bucketsLayerRef.current?.querySelector(`#bucket_${diff.payload.nodeId}`);
           if (el) {
             const keyTexts = el.querySelectorAll('.bucket-key-text');
             const keyText = keyTexts[index];
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
           const renderer = new HashRenderer(diff.snapshot.capacity);
           const newLayout = renderer.computeLayout(diff.snapshot as ExtendibleHash);
           
           const shiftX = window.innerWidth / 2;
           const shiftY = window.innerHeight / 2 - 100;
           newLayout.directory.forEach(d => { d.x += shiftX; d.y += shiftY; });
           newLayout.buckets.forEach(b => { b.x += shiftX; b.y += shiftY; });
           newLayout.links.forEach(l => { 
             l.sourceX += shiftX; l.sourceY += shiftY; 
             l.targetX += shiftX; l.targetY += shiftY; 
           });

           // 1. Links
           const linkSelection = d3.select(linksLayerRef.current)
             .selectAll<SVGPathElement, LayoutHashLink>('path')
             .data(newLayout.links, d => `${d.sourceIndex}-${d.targetId}`);

           const linksEnter = linkSelection.enter().append('path')
             .attr('class', styles.linkPath)
             .attr('d', d => `M ${d.sourceX} ${d.sourceY} L ${d.sourceX} ${d.sourceY}`)
             .style('opacity', 0);
             
           const allLinks = linkSelection.merge(linksEnter).nodes();
           if (allLinks.length > 0) {
             tl.to(allLinks, {
               attr: { 
                 d: (_, el) => { 
                    const d = d3.select(el).datum() as LayoutHashLink;
                    return `M ${d.sourceX} ${d.sourceY} L ${d.targetX} ${d.targetY}`;
                 } 
               },
               opacity: 1,
               duration: 0.5,
               ease: 'power2.out'
             }, 0);
           }
           
           linkSelection.exit().transition().duration(300).style('opacity', 0).remove();

           // 2. Directory Cells
           const dirSelection = d3.select(dirLayerRef.current)
             .selectAll<SVGGElement, LayoutDirectoryCell>('g.dir-cell')
             .data(newLayout.directory, d => d.index.toString());
             
           const dirEnter = dirSelection.enter().append('g')
             .attr('class', `dir-cell ${styles.nodeGroup}`)
             .attr('id', d => `dir_${d.index}`)
             .style('opacity', 0);
             
           dirEnter.each(function(d) {
             gsap.set(this, { x: d.x, y: d.y, scale: 0.5 });
           });

           const allDirSel = dirSelection.merge(dirEnter);
           
           allDirSel.each(function(d) {
              const g = d3.select(this);
              g.selectAll('*').remove();
              g.append('rect')
               .attr('class', styles.nodeRect)
               .attr('width', d.width)
               .attr('height', d.height);
               
              g.append('text')
               .attr('class', styles.keyText)
               .attr('x', d.width / 2)
               .attr('y', d.height / 2)
               .text(d.binaryStr);
           });

           const allDirNodes = allDirSel.nodes();
           if (allDirNodes.length > 0) {
             tl.to(allDirNodes, {
               x: (_, el) => (d3.select(el).datum() as LayoutDirectoryCell).x,
               y: (_, el) => (d3.select(el).datum() as LayoutDirectoryCell).y,
               scale: 1,
               opacity: 1,
               duration: 0.5,
               ease: 'power2.out'
             }, 0);
           }
           
           const exitDir = dirSelection.exit().nodes();
           if (exitDir.length > 0) {
               tl.to(exitDir, {
                   scale: 0.5,
                   opacity: 0,
                   duration: 0.3,
                   onComplete: () => d3.selectAll(exitDir).remove()
               }, 0);
           }

           // 3. Buckets
           const bucketSelection = d3.select(bucketsLayerRef.current)
             .selectAll<SVGGElement, LayoutBucket>('g.bucket-group')
             .data(newLayout.buckets, d => d.id.toString());
             
           const bucketEnter = bucketSelection.enter().append('g')
             .attr('class', `bucket-group ${styles.nodeGroup}`)
             .attr('id', d => `bucket_${d.id}`)
             .style('opacity', 0);
             
           bucketEnter.each(function(d) {
             gsap.set(this, { x: d.x, y: d.y, scale: 0.5 });
           });

           const allBucketsSel = bucketSelection.merge(bucketEnter);
           
           allBucketsSel.each(function(d) {
              const g = d3.select(this);
              g.selectAll('*').remove();
              
              // Header for local depth
              g.append('rect')
               .attr('class', styles.nodeRect)
               .attr('width', d.width)
               .attr('height', 20)
               .attr('y', -20)
               .style('fill', 'var(--glass-border)'); // Slightly different color for header
               
              g.append('text')
               .attr('class', styles.keyText)
               .attr('x', d.width / 2)
               .attr('y', -10)
               .style('font-size', '10px')
               .text(`Local Depth: ${d.localDepth}`);

              g.append('rect')
               .attr('class', styles.nodeRect)
               .attr('width', d.width)
               .attr('height', d.height);
               
              const keyWidth = d.width / Math.max(1, renderer['capacity']);
              for (let i = 0; i < Math.max(1, renderer['capacity']); i++) {
                 const key = d.keys[i];
                 const xPos = i * keyWidth;
                 const keyGroup = g.append('g').attr('transform', `translate(${xPos}, 0)`);
                 keyGroup.append('rect')
                   .attr('class', styles.keyRect)
                   .attr('width', keyWidth)
                   .attr('height', d.height);
                 if (key !== undefined) {
                   keyGroup.append('text')
                     .attr('class', `${styles.keyText} bucket-key-text`)
                     .attr('x', keyWidth / 2)
                     .attr('y', d.height / 2)
                     .text(key);
                 }
              }
           });

           const allBucketNodes = allBucketsSel.nodes();
           if (allBucketNodes.length > 0) {
             tl.to(allBucketNodes, {
               x: (_, el) => (d3.select(el).datum() as LayoutBucket).x,
               y: (_, el) => (d3.select(el).datum() as LayoutBucket).y,
               scale: 1,
               opacity: 1,
               duration: 0.5,
               ease: 'power2.out'
             }, 0);
           }
           
           const exitBuckets = bucketSelection.exit().nodes();
           if (exitBuckets.length > 0) {
               tl.to(exitBuckets, {
                   scale: 0.5,
                   opacity: 0,
                   duration: 0.3,
                   onComplete: () => d3.selectAll(exitBuckets).remove()
               }, 0);
           }
        }
        
        return tl;
      }
    });

    return () => {
      LayerRegistry.unregister('hash-layer');
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
        <g ref={dirLayerRef} className="directory" />
        <g ref={bucketsLayerRef} className="buckets" />
      </g>
    </svg>
  );
};
