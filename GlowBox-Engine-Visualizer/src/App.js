import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUIStore } from '@store/ui.store';
import { Starfield } from '@ui/canvas/Starfield';
import { Landing } from '@ui/shell/Landing';
import { IndexPicker } from '@ui/shell/IndexPicker';
import { Visualizer } from '@ui/shell/Visualizer';
export function App() {
    const { screen, theme } = useUIStore();
    return (_jsxs("div", { style: { position: 'relative', width: '100%', height: '100%' }, "data-theme": theme, children: [_jsx("svg", { className: "glow-filter-defs", "aria-hidden": true, children: _jsxs("defs", { children: [_jsxs("filter", { id: "glow-sm", children: [_jsx("feGaussianBlur", { stdDeviation: "3", result: "blur" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "blur" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] }), _jsxs("filter", { id: "glow-md", children: [_jsx("feGaussianBlur", { stdDeviation: "6", result: "blur" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "blur" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] }), _jsxs("filter", { id: "glow-lg", children: [_jsx("feGaussianBlur", { stdDeviation: "12", result: "blur" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "blur" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] })] }) }), _jsx(Starfield, { theme: theme }), screen === 'landing' && _jsx(Landing, {}), screen === 'index-picker' && _jsx(IndexPicker, {}), screen === 'visualizer' && _jsx(Visualizer, {})] }));
}
//# sourceMappingURL=App.js.map