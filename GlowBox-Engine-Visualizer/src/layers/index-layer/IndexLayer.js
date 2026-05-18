import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as d3 from 'd3';
import { LayerRegistry } from '../layer-registry';
import { useSessionStore } from '../../store/session.store';
import { BPlusRenderer } from './bplus-renderer';
import styles from './IndexLayer.module.css';
export const IndexLayer = () => {
    const treeState = useSessionStore(s => s.currentTreeState);
    const svgRef = useRef(null);
    const linksLayerRef = useRef(null);
    const nodesLayerRef = useRef(null);
    // Clear canvas if tree is null (e.g. session cleared)
    useEffect(() => {
        if (!treeState) {
            if (linksLayerRef.current)
                d3.select(linksLayerRef.current).selectAll('*').remove();
            if (nodesLayerRef.current)
                d3.select(nodesLayerRef.current).selectAll('*').remove();
        }
    }, [treeState]);
    useEffect(() => {
        LayerRegistry.register({
            id: 'index-layer',
            label: 'B+ Tree',
            component: IndexLayer,
            onDiff: (diff) => {
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
                    const index = diff.payload.index;
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
                        l.sourceX += shiftX;
                        l.sourceY += shiftY;
                        l.targetX += shiftX;
                        l.targetY += shiftY;
                    });
                    // 1. Links
                    const linkSelection = d3.select(linksLayerRef.current)
                        .selectAll('path')
                        .data(newLayout.links, d => `${d.sourceId}-${d.targetId}`);
                    const linksEnter = linkSelection.enter().append('path')
                        .attr('class', styles.linkPath)
                        .attr('d', d => `M ${d.sourceX} ${d.sourceY} L ${d.sourceX} ${d.sourceY}`)
                        .style('opacity', 0);
                    const allLinks = linkSelection.merge(linksEnter).nodes();
                    if (allLinks.length > 0) {
                        tl.to(allLinks, {
                            attr: {
                                d: (i, el) => {
                                    const d = d3.select(el).datum();
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
                        .selectAll('g.node-group')
                        .data(newLayout.nodes, d => d.id);
                    const nodeEnter = nodeSelection.enter().append('g')
                        .attr('class', `node-group ${styles.nodeGroup}`)
                        .attr('id', d => d.id)
                        .style('opacity', 0);
                    // Set initial position for new nodes to their target position but scaled down
                    nodeEnter.each(function (d) {
                        gsap.set(this, { x: d.x - d.width / 2, y: d.y - d.height / 2, scale: 0.5 });
                    });
                    const allNodesSel = nodeSelection.merge(nodeEnter);
                    // Redraw inner contents
                    allNodesSel.each(function (d) {
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
                            x: (i, el) => {
                                const d = d3.select(el).datum();
                                return d.x - d.width / 2;
                            },
                            y: (i, el) => {
                                const d = d3.select(el).datum();
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
    return (_jsxs("svg", { ref: svgRef, className: styles.svgCanvas, children: [_jsx("defs", { children: _jsxs("filter", { id: "glow-md", x: "-20%", y: "-20%", width: "140%", height: "140%", children: [_jsx("feGaussianBlur", { stdDeviation: "4", result: "blur" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "blur" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] }) }), _jsx("g", { ref: linksLayerRef, className: "links" }), _jsx("g", { ref: nodesLayerRef, className: "nodes" })] }));
};
//# sourceMappingURL=IndexLayer.js.map