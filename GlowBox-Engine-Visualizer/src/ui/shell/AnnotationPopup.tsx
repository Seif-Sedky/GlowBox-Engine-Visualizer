import React, { useEffect, useState } from 'react';
import styles from './AnnotationPopup.module.css';
import { useUIStore } from '../../store/ui.store';

interface AnnotationPopupProps {
  // In a real implementation, this state might be driven by the TimelineController
  // emitting events that a component listens to. For now, it's a structural placeholder.
}

export const AnnotationPopup: React.FC<AnnotationPopupProps> = () => {
  const annotationsOn = useUIStore(s => s.annotationsOn);
  
  // Placeholder state for demonstration. 
  // In reality, this would be updated when an ANNOTATION diff is processed by GSAP.
  const [annotation, setAnnotation] = useState<{ text: string, x: number, y: number } | null>(null);

  if (!annotationsOn || !annotation) {
    return null;
  }

  return (
    <div 
      className={`${styles.popupContainer} ${annotation ? styles.visible : ''}`}
      style={{ left: annotation.x, top: annotation.y }}
    >
      {annotation.text}
    </div>
  );
};
