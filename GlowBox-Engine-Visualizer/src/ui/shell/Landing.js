import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { THEMES } from '@store/theme.types';
import { useUIStore } from '@store/ui.store';
import styles from './Landing.module.css';
export function Landing() {
    const { theme, setTheme, setScreen } = useUIStore();
    const [hovered, setHovered] = useState(null);
    const [entered, setEntered] = useState(false);
    const [visible, setVisible] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);
    function handleEnter() {
        setEntered(true);
        setTimeout(() => setScreen('index-picker'), 700);
    }
    const activeTheme = THEMES[theme];
    return (_jsxs("div", { className: `${styles.root} ${visible ? styles.visible : ''} ${entered ? styles.exiting : ''}`, "data-theme": theme, children: [_jsx("div", { className: styles.blob, style: { background: activeTheme.accentGlow.replace('0.25', '0.12') } }), _jsxs("header", { className: styles.header, children: [_jsx("span", { className: styles.logoMark, children: "\u2726" }), _jsx("span", { className: styles.logoText, children: "GlowBox" })] }), _jsx("div", { className: styles.topRight, children: _jsx("button", { className: styles.aboutBtn, onClick: () => setShowAbout(true), children: "About" }) }), _jsxs("section", { className: styles.hero, children: [_jsx("h1", { className: `display-xl ${styles.title} glow-text`, children: "GlowBox" }), _jsxs("p", { className: styles.subtitle, children: ["Watch index structures breathe, split, and collapse \u2014", _jsx("br", {}), "in real time."] })] }), _jsxs("section", { className: styles.themeSection, children: [_jsx("p", { className: `label ${styles.themeLabel}`, children: "Choose your theme" }), _jsx("div", { className: styles.cards, children: Object.values(THEMES).map((t) => {
                            const isActive = theme === t.id;
                            const isHovered = hovered === t.id;
                            return (_jsxs("button", { className: `
                  glass glass-hover
                  ${styles.card}
                  ${isActive ? styles.cardActive : ''}
                `, style: {
                                    '--card-accent': t.accent,
                                    '--card-accent-2': t.accentSecondary,
                                    '--card-glow': t.accentGlow,
                                }, onClick: () => setTheme(t.id), onMouseEnter: () => setHovered(t.id), onMouseLeave: () => setHovered(null), "aria-pressed": isActive, children: [_jsx("div", { className: styles.cardGlowOrb, style: {
                                            opacity: isActive || isHovered ? 1 : 0,
                                            background: `radial-gradient(ellipse at top left, ${t.accentGlow}, transparent 70%)`,
                                        } }), isActive && (_jsx("div", { className: styles.activeRing, style: { boxShadow: `0 0 0 1px ${t.accent}, 0 0 24px ${t.accentGlow}` } })), _jsx("div", { className: styles.cardBar, style: { background: `linear-gradient(90deg, ${t.accent}, ${t.accentSecondary})` } }), _jsx("h3", { className: styles.cardName, style: { color: isActive ? t.accent : 'var(--text-primary)' }, children: t.name }), _jsx("p", { className: styles.cardTagline, children: t.tagline }), _jsxs("div", { className: styles.cardDataset, children: [_jsx("span", { className: "label", style: { color: t.accent }, children: "Preset" }), _jsx("span", { className: styles.datasetName, children: t.presetDataset.label }), _jsx("p", { className: styles.datasetDesc, children: t.presetDataset.description })] }), _jsx("div", { className: styles.selectionDot, style: { background: isActive ? t.accent : 'transparent', border: `1px solid ${isActive ? t.accent : 'var(--glass-border)'}`, boxShadow: isActive ? `0 0 10px ${t.accentGlow}` : 'none' } })] }, t.id));
                        }) })] }), _jsxs("div", { className: styles.enterWrap, children: [_jsxs("button", { className: styles.enterBtn, onClick: handleEnter, style: {
                            '--btn-accent': activeTheme.accent,
                            '--btn-accent-2': activeTheme.accentSecondary,
                            '--btn-glow': activeTheme.accentGlow,
                        }, children: [_jsx("span", { className: styles.enterBtnInner, children: "Enter Visualizer" }), _jsx("span", { className: styles.enterBtnGlow })] }), _jsx("p", { className: styles.enterHint, children: activeTheme.presetDataset.description })] }), showAbout && (_jsx("div", { className: styles.modalOverlay, onClick: () => setShowAbout(false), children: _jsxs("div", { className: `glass ${styles.modalContent}`, onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: styles.closeBtn, onClick: () => setShowAbout(false), children: "\u2715" }), _jsx("h2", { className: styles.modalTitle, children: "About GlowBox" }), _jsx("p", { className: styles.modalText, children: "GlowBox engine is my second baby project after NeoJackaroo, it is one that I am deeply passionate about, and intend to expand in the future, it includes a small subset of things that really fascinated me about one of the most sophisticated yet elegant softwares known to man: database engines." }), _jsx("div", { className: styles.modalDivider }), _jsx("h3", { className: styles.modalSubtitle, children: "Contact & Personal Profile" }), _jsxs("ul", { className: styles.modalLinks, children: [_jsxs("li", { children: [_jsx("span", { className: styles.modalLabel, children: "Name:" }), " Seif Alaa"] }), _jsxs("li", { children: [_jsx("span", { className: styles.modalLabel, children: "Email:" }), " ", _jsx("a", { href: "mailto:seif.alaa1231@gmail.com", children: "seif.alaa1231@gmail.com" })] }), _jsxs("li", { children: [_jsx("span", { className: styles.modalLabel, children: "LinkedIn:" }), " ", _jsx("a", { href: "https://linkedin.com/in/seif Alaa02", target: "_blank", rel: "noreferrer", children: "linkedin.com/in/seif Alaa02" })] }), _jsxs("li", { children: [_jsx("span", { className: styles.modalLabel, children: "GitHub:" }), " ", _jsx("a", { href: "https://github.com/Seif-Sedky", target: "_blank", rel: "noreferrer", children: "github.com/Seif-Sedky" })] })] })] }) }))] }));
}
//# sourceMappingURL=Landing.js.map