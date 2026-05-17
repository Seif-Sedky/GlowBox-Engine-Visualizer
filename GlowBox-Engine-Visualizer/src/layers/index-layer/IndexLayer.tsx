import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LayerRegistry } from '../layer-registry';
import { Diff } from '../../engine/diff.types';
import { useSessionStore } from '../../store/session.store';
import { BPlusTree } from '../../engine/structures/bplus-tree';
import { BPlusRenderer, LayoutNode, LayoutLink } from './bplus-renderer';
import styles from './IndexLayer.module.css';

export const IndexLayer: React.FC = () => {
  const treeState = useSessionStore(s => s.currentTreeState) as BPlusTree | null;
  const [nodes, setNodes] = useState<LayoutNode[]>([]);
  const [links, setLinks] = useState<LayoutLink[]>([]);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<Record<string, SVGGElement | null>>({});

  useEffect(() => {
    if (treeState) {
      const renderer = new BPlusRenderer(treeState.capacity);
      const layout = renderer.computeLayout(treeState);
      
      // Center the layout
      // For simplicity, shift everything down and right
      const shiftX = window.innerWidth / 2;
      const shiftY = 100;

      const shiftedNodes = layout.nodes.map(n => ({ ...n, x: n.x + shiftX, y: n.y + shiftY }));
      const shiftedLinks = layout.links.map(l => ({
        ...l,
        sourceX: l.sourceX + shiftX,
        sourceY: l.sourceY + shiftY,
        targetX: l.targetX + shiftX,
        targetY: l.targetY + shiftY,
      }));

      setNodes(shiftedNodes);
      setLinks(shiftedLinks);
    } else {
      setNodes([]);
      setLinks([]);
    }
  }, [treeState]); // In a fully diff-driven approach, this would update via diffs

  useEffect(() => {
    LayerRegistry.register({
      id: 'index-layer',
      label: 'B+ Tree',
      component: IndexLayer,
      onDiff: (diff: Diff) => {
        // Here we handle the diffs and create GSAP tweens
        console.log('[IndexLayer] Received Diff:', diff);
        
        const tl = gsap.timeline();
        
        if (diff.type === 'NODE_HIGHLIGHT') {
          const nodeId = `node_${diff.payload.nodeId}`;
          const el = nodeRefs.current[nodeId];
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
           const nodeId = `node_${diff.payload.nodeId}`;
           const index = diff.payload.index as number;
           const el = nodeRefs.current[nodeId];
           if (el) {
             const keyText = el.querySelectorAll('text')[index];
             if (keyText) {
                tl.to(keyText, {
                  fill: 'var(--accent)',
                  scale: 1.2,
                  duration: 0.2,
                  yoyo: true,
                  repeat: 1,
                  transformOrigin: '50% 50%'
                });
             }
           }
        }
        
        // Structural diffs (CREATE, SPLIT) would trigger layout recomputation and x/y animation here.
        // We will keep it simple for the initial implementation.
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

      <g className="links">
        {links.map((link, i) => (
          <path
            key={i}
            className={styles.linkPath}
            d={`M ${link.sourceX} ${link.sourceY} L ${link.targetX} ${link.targetY}`}
          />
        ))}
      </g>

      <g className="nodes">
        {nodes.map(node => (
          <g
            key={node.id}
            ref={el => nodeRefs.current[node.id] = el}
            className={styles.nodeGroup}
            transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}
          >
            <rect
              className={styles.nodeRect}
              width={node.width}
              height={node.height}
            />
            {node.keys.map((key, idx) => {
              const keyWidth = node.width / Math.max(1, node.keys.length);
              const xPos = idx * keyWidth;
              return (
                <g key={idx} transform={`translate(${xPos}, 0)`}>
                  <rect
                    className={styles.keyRect}
                    width={keyWidth}
                    height={node.height}
                  />
                  <text
                    className={styles.keyText}
                    x={keyWidth / 2}
                    y={node.height / 2}
                  >
                    {key}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </g>
    </svg>
  );
};
