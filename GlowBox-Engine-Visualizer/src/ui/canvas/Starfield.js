import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { THEMES } from '@store/theme.types';
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}
export function Starfield({ theme, count = 220 }) {
    const canvasRef = useRef(null);
    const themeRef = useRef(theme);
    themeRef.current = theme;
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0;
        let stars = [];
        let raf;
        function resize() {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }
        function init() {
            resize();
            stars = Array.from({ length: count }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                z: Math.random(),
                vz: 0.0002 + Math.random() * 0.0004,
                pulse: Math.random() * Math.PI * 2,
            }));
        }
        function draw(t) {
            ctx.clearRect(0, 0, W, H);
            const tint = THEMES[themeRef.current].starTint;
            const { r, g, b } = hexToRgb(tint);
            for (const s of stars) {
                s.pulse += s.vz * 8;
                s.z = (s.z + s.vz) % 1;
                const size = 0.4 + s.z * 1.8;
                const twinkle = 0.55 + 0.45 * Math.sin(s.pulse + t * 0.0008);
                const alpha = (0.15 + s.z * 0.65) * twinkle;
                // dominant white-ish with a theme tint on deeper stars
                const tintStrength = s.z * 0.55;
                const sr = Math.round(255 * (1 - tintStrength) + r * tintStrength);
                const sg = Math.round(255 * (1 - tintStrength) + g * tintStrength);
                const sb = Math.round(255 * (1 - tintStrength) + b * tintStrength);
                // glow halo on brighter stars
                if (s.z > 0.7) {
                    const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 4);
                    grd.addColorStop(0, `rgba(${sr},${sg},${sb},${alpha * 0.5})`);
                    grd.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = `rgba(${sr},${sg},${sb},${alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        }
        init();
        raf = requestAnimationFrame(draw);
        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, [count]);
    return (_jsx("canvas", { ref: canvasRef, style: {
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
        } }));
}
//# sourceMappingURL=Starfield.js.map