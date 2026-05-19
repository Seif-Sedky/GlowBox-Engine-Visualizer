import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUIStore } from '@store/ui.store';
import { THEMES } from '@store/theme.types';
import { useSessionStore } from '@store/session.store';
import styles from './Navbar.module.css';
const PAGE_SIZES = [1024, 2048, 4096, 8192, 16384];
function formatPageSize(b) {
    return b >= 1024 ? `${b / 1024} KB` : `${b} B`;
}
export function Navbar() {
    const { theme, speed, annotationsOn, maxKeys, minKeys, indexType, setSpeed, toggleAnnotations, setMaxKeys, setMinKeys, setScreen, } = useUIStore();
    const activeTheme = THEMES[theme];
    return (_jsxs("nav", { className: `glass ${styles.nav}`, "data-theme": theme, children: [_jsxs("button", { className: styles.logo, onClick: () => setScreen('landing'), title: "Back to landing", children: [_jsx("span", { className: styles.logoMark, style: { color: activeTheme.accent }, children: "\u2726" }), _jsx("span", { className: styles.logoText, children: "GlowBox" })] }), _jsxs("div", { className: styles.center, style: { gap: '2rem' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx("span", { className: "label", style: { color: activeTheme.accent }, children: "Max Keys" }), _jsx("div", { className: styles.pageSizePills, children: [2, 4, 6, 8].map((s) => (_jsx("button", { className: `${styles.pill} ${maxKeys === s ? styles.pillActive : ''}`, style: maxKeys === s ? {
                                        background: activeTheme.accentGlow,
                                        borderColor: activeTheme.accent,
                                        color: activeTheme.accent,
                                        boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
                                    } : {}, onClick: () => {
                                        setMaxKeys(s);
                                        useSessionStore.getState().clearSession();
                                    }, children: s }, s))) })] }), indexType !== 'hash' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx("span", { className: "label", style: { color: activeTheme.accent }, children: "Min Keys" }), _jsx("div", { className: styles.pageSizePills, children: [1, 2, 3, 4].map((u) => (_jsx("button", { className: `${styles.pill} ${minKeys === u ? styles.pillActive : ''}`, style: minKeys === u ? {
                                        background: activeTheme.accentGlow,
                                        borderColor: activeTheme.accent,
                                        color: activeTheme.accent,
                                        boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
                                    } : {}, onClick: () => {
                                        setMinKeys(u);
                                        useSessionStore.getState().clearSession();
                                    }, children: u }, u))) })] }))] }), _jsxs("div", { className: styles.right, children: [_jsxs("button", { className: `${styles.toggleBtn} ${annotationsOn ? styles.toggleOn : ''}`, style: annotationsOn ? {
                            borderColor: activeTheme.accent,
                            color: activeTheme.accent,
                            boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
                        } : {}, onClick: toggleAnnotations, title: "Toggle annotations", children: [_jsx("span", { className: styles.toggleIcon, children: annotationsOn ? '◉' : '○' }), _jsx("span", { className: styles.toggleLabel, children: "Notes" })] }), _jsxs("div", { className: styles.speedWrap, children: [_jsx("span", { className: "label", style: { color: activeTheme.accent }, children: "Speed" }), _jsxs("div", { className: styles.sliderRow, children: [_jsxs("span", { className: styles.sliderVal, children: [speed.toFixed(2), "\u00D7"] }), _jsx("input", { type: "range", min: 0.25, max: 3, step: 0.25, value: speed, onChange: (e) => setSpeed(Number(e.target.value)), className: styles.slider, style: { '--slider-accent': activeTheme.accent } })] })] })] })] }));
}
//# sourceMappingURL=Navbar.js.map