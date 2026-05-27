import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as d3 from 'd3';
import { LayerRegistry } from '../layer-registry';
import { Diff } from '../../engine/diff.types';
import { useSessionStore } from '../../store/session.store';
import { useUIStore } from '../../store/ui.store';
import { THEMES } from '../../store/theme.types';
import { InvertedIndex } from '../../engine/structures/inverted-index';
import { renderInvertedIndex } from './inverted-renderer';
import styles from '../index-layer/IndexLayer.module.css';

export const InvertedLayer: React.FC = () => {
  const treeState = useSessionStore(s => s.currentTreeState) as InvertedIndex | null;
  const { theme } = useUIStore();
  const activeTheme = THEMES[theme];
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // We keep a local ref of the current snapshot to render
  const snapshotRef = useRef<InvertedIndex | null>(null);
  const activeNodeRef = useRef<string | null>(null);
  const activeTermRef = useRef<number | null>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !zoomGroupRef.current) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        d3.select(zoomGroupRef.current).attr('transform', event.transform);
      });
    d3.select(svgRef.current).call(zoom);
  }, []);

  const performRender = () => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const svgG = d3.select(zoomGroupRef.current) as any;

    if (snapshotRef.current) {
       renderInvertedIndex(
         { svg: svgG, width, height, theme: activeTheme },
         snapshotRef.current,
         { activeNodeId: activeNodeRef.current, activeTermId: activeTermRef.current }
       );
    } else if (treeState) {
       renderInvertedIndex(
         { svg: svgG, width, height, theme: activeTheme },
         treeState,
         { activeNodeId: null, activeTermId: null }
       );
    } else {
       svgG.selectAll('*').remove();
    }
  };

  useEffect(() => {
    performRender();
  }, [treeState, activeTheme]);

  useEffect(() => {
    LayerRegistry.register({
      id: 'inverted-layer',
      label: 'Inverted Index',
      component: InvertedLayer,
      onDiff: (diff: Diff) => {
        const tl = gsap.timeline();

        if (diff.snapshot) {
          snapshotRef.current = diff.snapshot;
        }

        if (diff.type === 'FST_NODE_HIGHLIGHT') {
           activeNodeRef.current = diff.payload.nodeId;
           activeTermRef.current = null;
        } else if (diff.type === 'POSTING_APPEND') {
           // Keep the last active node highlighted
           if (diff.payload.highlight) {
             activeTermRef.current = diff.payload.termId;
           } else {
             activeTermRef.current = null;
           }
        } else {
           activeNodeRef.current = null;
           activeTermRef.current = null;
        }

        tl.call(() => {
           performRender();
        });
        
        if (diff.type === 'FST_NODE_HIGHLIGHT') {
            tl.to({}, { duration: 0.3 });
        } else if (diff.type === 'POSTING_APPEND' && diff.payload.highlight) {
            tl.to({}, { duration: 0.8 }); // longer delay to see the result
        }

        return tl;
      }
    });

    return () => {
      LayerRegistry.unregister('inverted-layer');
    };
  }, [activeTheme]);

  return (
    <div className={styles.layerContainer} ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} className={styles.svgCanvas}>
        <g ref={zoomGroupRef} />
      </svg>
    </div>
  );
};
