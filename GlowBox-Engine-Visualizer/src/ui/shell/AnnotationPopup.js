import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import styles from './AnnotationPopup.module.css';
import { useUIStore } from '../../store/ui.store';
export const AnnotationPopup = () => {
    const annotationsOn = useUIStore(s => s.annotationsOn);
    // Placeholder state for demonstration. 
    // In reality, this would be updated when an ANNOTATION diff is processed by GSAP.
    const [annotation, setAnnotation] = useState(null);
    if (!annotationsOn || !annotation) {
        return null;
    }
    return (_jsx("div", { className: `${styles.popupContainer} ${annotation ? styles.visible : ''}`, style: { left: annotation.x, top: annotation.y }, children: annotation.text }));
};
//# sourceMappingURL=AnnotationPopup.js.map