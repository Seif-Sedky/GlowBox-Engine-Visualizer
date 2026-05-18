import React from 'react';
import styles from './AnnotationPopup.module.css';
import { useUIStore } from '../../store/ui.store';

export const AnnotationPopup: React.FC = () => {
  const annotationsOn = useUIStore(s => s.annotationsOn);
  const stepLog = useUIStore(s => s.stepLog);

  if (!annotationsOn || stepLog.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.popupContainer} ${styles.visible}`}>
      <h3 className={styles.title}>Operation Log</h3>
      <ul className={styles.logList}>
        {stepLog.map((log, i) => (
          <li key={i} className={styles.logItem}>
            <span className={styles.logBullet}>•</span>
            {log}
          </li>
        ))}
      </ul>
    </div>
  );
};
