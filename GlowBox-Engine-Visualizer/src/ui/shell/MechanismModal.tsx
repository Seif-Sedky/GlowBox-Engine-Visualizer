import React from 'react';
import { MECHANISM_DATA } from './mechanismData';
import { useUIStore } from '@store/ui.store';
import styles from './MechanismModal.module.css';

interface Props {
  onClose: () => void;
}

export const MechanismModal: React.FC<Props> = ({ onClose }) => {
  const { indexType } = useUIStore();
  
  const mechanism = MECHANISM_DATA[indexType] || MECHANISM_DATA['bplus'];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`glass ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        
        <h2 className={styles.title}>{mechanism.title}</h2>
        
        <div className={styles.content}>
          {mechanism.sections.map((section, sIdx) => (
            <div key={sIdx} className={styles.section}>
              {section.heading && <h3 className={styles.heading}>{section.heading}</h3>}
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className={styles.paragraph}>{p}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
