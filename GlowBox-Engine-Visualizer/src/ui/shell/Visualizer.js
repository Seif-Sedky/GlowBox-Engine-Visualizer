import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUIStore } from '@store/ui.store';
import { Navbar } from './Navbar';
import { BottomControls } from './BottomControls';
import { AnnotationPopup } from './AnnotationPopup';
import { IndexLayer } from '../../layers/index-layer/IndexLayer';
import { HashLayer } from '../../layers/hash-layer/HashLayer';
import styles from './Visualizer.module.css';
export function Visualizer() {
    const { theme } = useUIStore();
    return (_jsxs("div", { className: styles.root, "data-theme": theme, children: [_jsx(Navbar, {}), _jsxs("main", { className: styles.main, children: [useUIStore.getState().indexType === 'hash' ? _jsx(HashLayer, {}) : _jsx(IndexLayer, {}), _jsx(AnnotationPopup, {})] }), _jsx(BottomControls, {})] }));
}
//# sourceMappingURL=Visualizer.js.map