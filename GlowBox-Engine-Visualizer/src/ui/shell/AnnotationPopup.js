import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './AnnotationPopup.module.css';
import { useUIStore } from '../../store/ui.store';
export const AnnotationPopup = () => {
    const annotationsOn = useUIStore(s => s.annotationsOn);
    const stepLog = useUIStore(s => s.stepLog);
    if (!annotationsOn || stepLog.length === 0) {
        return null;
    }
    return (_jsxs("div", { className: `${styles.popupContainer} ${styles.visible}`, children: [_jsx("h3", { className: styles.title, children: "Operation Log" }), _jsx("ul", { className: styles.logList, children: stepLog.map((log, i) => (_jsxs("li", { className: styles.logItem, children: [_jsx("span", { className: styles.logBullet, children: "\u2022" }), log] }, i))) })] }));
};
//# sourceMappingURL=AnnotationPopup.js.map